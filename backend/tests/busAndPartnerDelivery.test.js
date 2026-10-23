const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const DeliveryAssignment = require('../src/models/DeliveryAssignment');
const Bus = require('../src/models/Bus');

// Mock auth middleware for Village Partner Shopkeeper & Runner
let mockCurrentPartnerUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Shyam Sunder (Sandwa Partner)',
    role: 'partner_shop',
    mobile: '9876512345'
};

jest.mock('../src/middlewares/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = mockCurrentPartnerUser;
        next();
    },
    checkPermission: () => (req, res, next) => next()
}));

// Mock Notification and WhatsApp Services
jest.mock('../src/services/notificationService', () => ({
    notifyOrderArrivedAtPartnerShop: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/services/whatsappService', () => ({
    sendOrderShippedToBusNotification: jest.fn().mockResolvedValue(true),
    sendDeliveryAssignmentNotification: jest.fn().mockResolvedValue(true)
}));

const partnerShopRoutes = require('../src/routes/partnerShopRoutes');
const deliveryController = require('../src/controllers/deliveryController');

const app = express();
app.use(express.json());
app.use('/api/partner-shop', partnerShopRoutes);

const { protect } = require('../src/middlewares/authMiddleware');

// Route for runner updating delivery status (Leg 1 handover)
app.patch('/api/delivery/assignments/:id/status', protect, deliveryController.updateAssignmentStatus);

describe('FR-08 & Workflow A: Dual Delivery Management (Two-Leg Bus Logistics & Partner COD)', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Leg 1: Central Dispatch to Transit Bus Conductor', () => {
        it('[Positive] should transition Order to "In Transit" when runner completes handover to bus conductor', async () => {
            const assignmentId = new mongoose.Types.ObjectId();
            const orderId = new mongoose.Types.ObjectId();
            const busId = new mongoose.Types.ObjectId();
            const runnerUserId = new mongoose.Types.ObjectId();

            const mockAssignment = {
                _id: assignmentId,
                orderId,
                busId,
                deliveryBoyId: runnerUserId,
                status: 'Assigned',
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(DeliveryAssignment, 'findById').mockResolvedValue(mockAssignment);
            jest.spyOn(Order, 'findByIdAndUpdate').mockResolvedValue({});
            
            const mockOrderChain = {
                populate: jest.fn().mockResolvedValue({
                    _id: orderId,
                    user: { name: 'Gopal Lal', mobile: '9829012345' }
                }),
                then: (resolve) => resolve({
                    _id: orderId,
                    user: { name: 'Gopal Lal', mobile: '9829012345' }
                })
            };
            jest.spyOn(Order, 'findById').mockReturnValue(mockOrderChain);
            jest.spyOn(Bus, 'findById').mockResolvedValue({
                _id: busId,
                busName: 'Chhapar-Sandwa Express',
                busNumber: 'RJ-10-PA-4050'
            });

            mockCurrentPartnerUser = {
                _id: runnerUserId,
                name: 'Karan Runner',
                role: 'runner',
                mobile: '9876543210'
            };

            const res = await request(app)
                .patch(`/api/delivery/assignments/${assignmentId}/status`)
                .send({
                    status: 'Delivered', // Runner marks their leg completed
                    handoverImage: 'https://cdn.dharmarth.org/bus-handover-proof.jpg',
                    driverNumber: '9828001122',
                    actualDepartureTime: new Date('2026-10-22T10:30:00Z'),
                    notes: 'Parcel handed over to conductor Suraj Mal'
                });

            expect(res.status).toBe(200);
            expect(mockAssignment.status).toBe('Delivered');
            expect(mockAssignment.handoverImage).toBe('https://cdn.dharmarth.org/bus-handover-proof.jpg');
            expect(mockAssignment.driverNumber).toBe('9828001122');
            expect(mockAssignment.save).toHaveBeenCalled();

            // Order must transition to 'In Transit' (NOT delivered to patient yet)
            expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
                orderId,
                expect.objectContaining({
                    status: 'In Transit',
                    $push: expect.objectContaining({
                        statusHistory: expect.objectContaining({
                            status: 'In Transit',
                            note: expect.stringContaining('Handed over to Bus Conductor')
                        })
                    })
                })
            );
        });

        it('[Negative] should return 404 if delivery assignment ID does not exist', async () => {
            const nonExistentAssignmentId = new mongoose.Types.ObjectId();
            jest.spyOn(DeliveryAssignment, 'findById').mockResolvedValue(null);

            const res = await request(app)
                .patch(`/api/delivery/assignments/${nonExistentAssignmentId}/status`)
                .send({ status: 'Delivered' });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Assignment not found');
        });
    });

    describe('Leg 2: Transit to Village Partner Handover & Receipt', () => {
        beforeEach(() => {
            mockCurrentPartnerUser = {
                _id: new mongoose.Types.ObjectId(),
                name: 'Shyam Sunder (Sandwa Partner)',
                role: 'partner_shop',
                mobile: '9876512345'
            };
        });

        it('[Positive] should mark parcel "Arrived at Partner Shop" and auto-generate 4-digit pickup OTP', async () => {
            const orderId = new mongoose.Types.ObjectId();
            const mockOrder = {
                _id: orderId,
                status: 'In Transit',
                partnerShop: {},
                statusHistory: [],
                save: jest.fn().mockResolvedValue(true)
            };

            mockOrder.populate = jest.fn().mockResolvedValue({
                ...mockOrder,
                user: { name: 'Gopal Lal', mobile: '9829012345' }
            });
            jest.spyOn(Order, 'findById').mockReturnValue(mockOrder);

            const res = await request(app)
                .post(`/api/partner-shop/orders/${orderId}/receive-bus`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Parcel marked as received in shop');
            expect(mockOrder.status).toBe('Arrived at Partner Shop');
            expect(mockOrder.partnerShop.pickupOtp).toBeDefined();
            expect(mockOrder.partnerShop.pickupOtp).toMatch(/^\d{4}$/); // 4-digit numeric OTP
            expect(mockOrder.save).toHaveBeenCalled();
        });

        it('[Negative] should return 404 when partner attempts to receive a non-existent order', async () => {
            const nonExistentOrderId = new mongoose.Types.ObjectId();
            jest.spyOn(Order, 'findById').mockResolvedValue(null);

            const res = await request(app)
                .post(`/api/partner-shop/orders/${nonExistentOrderId}/receive-bus`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Order not found');
        });
    });

    describe('Customer Handover & Partner Cash on Delivery (COD) Verification', () => {
        beforeEach(() => {
            mockCurrentPartnerUser = {
                _id: new mongoose.Types.ObjectId(),
                name: 'Shyam Sunder (Sandwa Partner)',
                role: 'partner_shop',
                mobile: '9876512345'
            };
        });

        it('[Positive] should verify valid OTP, collect partner COD, and mark order "Delivered"', async () => {
            const orderId = new mongoose.Types.ObjectId();
            const mockOrder = {
                _id: orderId,
                status: 'Arrived at Partner Shop',
                partnerShop: {
                    pickupOtp: '4821',
                    shopName: 'Sandwa Medical Partner'
                },
                paymentDetails: {
                    method: 'PARTNER_COD',
                    status: 'Pending'
                },
                totalAmount: 320,
                statusHistory: [],
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

            const res = await request(app)
                .post(`/api/partner-shop/orders/${orderId}/handover-otp`)
                .send({
                    otp: '4821',
                    cashCollected: true
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('handed over to patient successfully');
            expect(mockOrder.status).toBe('Delivered');
            expect(mockOrder.partnerShop.codCollected).toBe(true);
            expect(mockOrder.partnerShop.codAmount).toBe(320);
            expect(mockOrder.paymentDetails.status).toBe('Completed');
            expect(mockOrder.save).toHaveBeenCalled();
        });

        it('[Negative] should reject handover and return 400 when an invalid OTP is entered', async () => {
            const orderId = new mongoose.Types.ObjectId();
            const mockOrder = {
                _id: orderId,
                status: 'Arrived at Partner Shop',
                partnerShop: {
                    pickupOtp: '4821'
                },
                paymentDetails: {
                    method: 'PARTNER_COD',
                    status: 'Pending'
                },
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

            const res = await request(app)
                .post(`/api/partner-shop/orders/${orderId}/handover-otp`)
                .send({
                    otp: '9999', // Wrong OTP
                    cashCollected: true
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid OTP. Please verify with patient.');
            expect(mockOrder.status).toBe('Arrived at Partner Shop'); // Status must remain unchanged
            expect(mockOrder.save).not.toHaveBeenCalled();
        });

        it('[Negative] should return 404 when handing over a non-existent order', async () => {
            const nonExistentOrderId = new mongoose.Types.ObjectId();
            jest.spyOn(Order, 'findById').mockResolvedValue(null);

            const res = await request(app)
                .post(`/api/partner-shop/orders/${nonExistentOrderId}/handover-otp`)
                .send({ otp: '1234' });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Order not found');
        });
    });
});
