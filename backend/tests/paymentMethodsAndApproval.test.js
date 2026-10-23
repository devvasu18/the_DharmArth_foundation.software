const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Prescription = require('../src/models/Prescription');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const Settings = require('../src/models/Settings');

// Mock auth middleware for customer
let mockCurrentUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Ramesh Verma',
    role: 'customer',
    mobile: '9876543210',
    walletBalance: 500,
    save: jest.fn().mockResolvedValue(true)
};

jest.mock('../src/middlewares/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = mockCurrentUser;
        next();
    },
    optionalProtect: (req, res, next) => {
        req.user = mockCurrentUser;
        next();
    },
    checkPermission: () => (req, res, next) => next()
}));

// Mock cloudinary upload middleware
jest.mock('../src/config/cloudinary', () => ({
    upload: {
        single: () => (req, res, next) => next()
    }
}));

const prescriptionRoutes = require('../src/routes/prescriptionRoutes');

const app = express();
app.use(express.json());
// Inject req.user for tests calling approve endpoint
app.use((req, res, next) => {
    req.user = mockCurrentUser;
    next();
});
app.use('/api/prescriptions', prescriptionRoutes);

describe('FR-06: Multi-Tier Payments, Partner COD & Order Creation', () => {
    beforeEach(() => {
        mockCurrentUser.walletBalance = 500;
        mockCurrentUser.save = jest.fn().mockResolvedValue(true);
        // Default pharmacy config mock
        jest.spyOn(Settings, 'findOne').mockResolvedValue({
            key: 'pharmacy_config',
            value: {
                platformFeePercent: 0,
                deliveryChargeType: 'flat',
                flatDeliveryCharge: 30,
                gstPercent: 0
            }
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('POST /api/prescriptions/:id/approve', () => {
        it('[Positive] should create order with Partner COD, status "Ready for Packing", and retain recipient details', async () => {
            const rxId = new mongoose.Types.ObjectId();
            const patientUserId = new mongoose.Types.ObjectId();

            const mockRx = {
                _id: rxId,
                user: patientUserId,
                status: 'Verified',
                recipientDetails: {
                    type: 'Other',
                    patientName: 'Ramprasad Verma',
                    relationship: 'Father',
                    mobile: '9829099887'
                },
                courseDays: 30,
                verifiedItems: [
                    { medicineName: 'Metformin 500', price: 120, quantity: 2, isAvailable: true, fulfillmentStatus: 'In Stock' }
                ],
                verificationLog: [],
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Prescription, 'findById').mockResolvedValue(mockRx);

            let createdOrderData = null;
            jest.spyOn(Order, 'create').mockImplementation((data) => {
                createdOrderData = data;
                return Promise.resolve({
                    _id: new mongoose.Types.ObjectId(),
                    ...data
                });
            });

            jest.spyOn(User, 'findById').mockResolvedValue({
                _id: mockCurrentUser._id,
                savedAddresses: [],
                save: jest.fn().mockResolvedValue(true)
            });

            const res = await request(app)
                .post(`/api/prescriptions/${rxId}/approve`)
                .send({
                    paymentMethod: 'PARTNER_COD',
                    shippingAddress: {
                        street: 'Near Bus Stand, Main Market',
                        city: 'Sandwa',
                        villageName: 'Sandwa Partner Medical',
                        stoppageName: 'Sandwa Bus Stop',
                        zip: '331517',
                        phone: '9829099887'
                    }
                });

            expect(res.status).toBe(201);
            expect(createdOrderData).toBeDefined();
            expect(createdOrderData.status).toBe('Ready for Packing'); // Directly ready for packing!
            expect(createdOrderData.paymentDetails.method).toBe('PARTNER_COD');
            expect(createdOrderData.paymentDetails.status).toBe('Pending');
            expect(createdOrderData.courseDays).toBe(30);
            expect(createdOrderData.recipientDetails.type).toBe('Other');
            expect(createdOrderData.recipientDetails.patientName).toBe('Ramprasad Verma');
            expect(createdOrderData.partnerShop.shopName).toBe('Sandwa Partner Medical');
            expect(mockRx.status).toBe('Ordered');
            expect(mockRx.save).toHaveBeenCalled();
        });

        it('[Positive] should deduct wallet balance and set status "Ready for Packing" when paying via Dharmarth Wallet', async () => {
            const rxId = new mongoose.Types.ObjectId();
            const mockRx = {
                _id: rxId,
                user: mockCurrentUser._id,
                status: 'Verified',
                recipientDetails: { type: 'Self' },
                courseDays: 15,
                verifiedItems: [
                    { medicineName: 'Paracetamol 650', price: 100, quantity: 1, isAvailable: true }
                ],
                verificationLog: [],
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Prescription, 'findById').mockResolvedValue(mockRx);

            let createdOrderData = null;
            jest.spyOn(Order, 'create').mockImplementation((data) => {
                createdOrderData = data;
                return Promise.resolve({ _id: new mongoose.Types.ObjectId(), ...data });
            });

            jest.spyOn(User, 'findById').mockResolvedValue({
                _id: mockCurrentUser._id,
                savedAddresses: [],
                save: jest.fn().mockResolvedValue(true)
            });

            // Subtotal 100 + Flat Delivery 30 = 130
            const res = await request(app)
                .post(`/api/prescriptions/${rxId}/approve`)
                .send({
                    paymentMethod: 'Wallet',
                    shippingAddress: {
                        street: 'Station Road',
                        city: 'Chhapar',
                        zip: '331502',
                        phone: '9876543210'
                    }
                });

            expect(res.status).toBe(201);
            expect(createdOrderData.status).toBe('Ready for Packing');
            expect(createdOrderData.paymentDetails.method).toBe('Wallet');
            expect(createdOrderData.paymentDetails.status).toBe('Completed');
            // Wallet should be deducted: 500 - 130 = 370
            expect(mockCurrentUser.walletBalance).toBe(370);
            expect(mockCurrentUser.save).toHaveBeenCalled();
        });

        it('[Negative] should return 400 when user has insufficient wallet balance for payment', async () => {
            const rxId = new mongoose.Types.ObjectId();
            mockCurrentUser.walletBalance = 50; // Insufficient (order is ~130)

            const mockRx = {
                _id: rxId,
                user: mockCurrentUser._id,
                status: 'Verified',
                verifiedItems: [
                    { medicineName: 'Amoxicillin 500', price: 100, quantity: 1, isAvailable: true }
                ],
                verificationLog: [],
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Prescription, 'findById').mockResolvedValue(mockRx);
            jest.spyOn(Order, 'create').mockResolvedValue({});

            const res = await request(app)
                .post(`/api/prescriptions/${rxId}/approve`)
                .send({
                    paymentMethod: 'Wallet',
                    shippingAddress: { city: 'Bidasar', zip: '331501' }
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Insufficient wallet balance');
            expect(Order.create).not.toHaveBeenCalled();
        });

        it('[Negative] should return 400 when attempting to checkout an unverified prescription', async () => {
            const rxId = new mongoose.Types.ObjectId();
            const mockRx = {
                _id: rxId,
                user: mockCurrentUser._id,
                status: 'Pending', // Unverified!
                verifiedItems: []
            };

            jest.spyOn(Prescription, 'findById').mockResolvedValue(mockRx);

            const res = await request(app)
                .post(`/api/prescriptions/${rxId}/approve`)
                .send({ paymentMethod: 'PARTNER_COD' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid or unverified prescription');
        });

        it('[Negative] should return 400 if prescription has 0 available items', async () => {
            const rxId = new mongoose.Types.ObjectId();
            const mockRx = {
                _id: rxId,
                user: mockCurrentUser._id,
                status: 'Verified',
                verifiedItems: [
                    { medicineName: 'Rare Drug', isAvailable: false }
                ]
            };

            jest.spyOn(Prescription, 'findById').mockResolvedValue(mockRx);

            const res = await request(app)
                .post(`/api/prescriptions/${rxId}/approve`)
                .send({ paymentMethod: 'PARTNER_COD' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('No items are currently available');
        });

        it('[Negative] should return 400 if prescription ID does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            jest.spyOn(Prescription, 'findById').mockResolvedValue(null);

            const res = await request(app)
                .post(`/api/prescriptions/${nonExistentId}/approve`)
                .send({ paymentMethod: 'PARTNER_COD' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid or unverified prescription');
        });
    });
});
