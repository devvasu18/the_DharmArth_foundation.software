const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Order = require('../src/models/Order');

// Mock auth middleware to simulate a dedicated Medicine Packer
jest.mock('../src/middlewares/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = {
            _id: '652000000000000000000001',
            name: 'Vikram Packer',
            role: 'packer',
            mobile: '9876543210'
        };
        next();
    },
    checkPermission: () => (req, res, next) => next()
}));

const orderRoutes = require('../src/routes/orderRoutes');

const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('FR-07: Dedicated Medicine Packing Console & Quality Verification', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('GET /api/orders/packing-queue (Queue Retrieval)', () => {
        it('[Positive] should return all orders ready for medicine packing with batch and duration details', async () => {
            const mockPackingOrders = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    status: 'Ready for Packing',
                    courseDays: 15,
                    items: [
                        { name: 'Paracetamol 650', quantity: 2, margBatch: 'PCM-2026', margExpiry: '12/28' }
                    ],
                    user: { name: 'Rahul Sharma', mobile: '9876543210' }
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    status: 'Advance Paid',
                    courseDays: 30,
                    items: [
                        { name: 'Azithromycin 500', quantity: 3, margBatch: 'AZI-9981', margExpiry: '06/27' }
                    ],
                    user: { name: 'Sunita Devi', mobile: '9876500000' }
                }
            ];

            const mockFindChain = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(mockPackingOrders)
            };
            jest.spyOn(Order, 'find').mockReturnValue(mockFindChain);

            const res = await request(app).get('/api/orders/packing-queue');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(res.body[0].status).toBe('Ready for Packing');
            expect(res.body[0].courseDays).toBe(15);
            expect(res.body[0].items[0].margBatch).toBe('PCM-2026');
            expect(Order.find).toHaveBeenCalledWith({
                status: { $in: ['Ready for Packing', 'Advance Paid', 'Processing'] }
            });
        });

        it('[Negative] should return 500 when database fails during packing queue retrieval', async () => {
            const mockFindChain = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockRejectedValue(new Error('Packing database connection failure'))
            };
            jest.spyOn(Order, 'find').mockReturnValue(mockFindChain);

            const res = await request(app).get('/api/orders/packing-queue');

            expect(res.status).toBe(500);
            expect(res.body.message).toBe('Packing database connection failure');
        });
    });

    describe('POST /api/orders/:id/pack (Pack & Affix Barcode/Seal)', () => {
        it('[Positive] should verify physical strips, affix tamper seal, and mark order "Ready for Dispatch"', async () => {
            const orderId = new mongoose.Types.ObjectId();
            const mockOrder = {
                _id: orderId,
                status: 'Ready for Packing',
                statusHistory: [],
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

            const res = await request(app)
                .post(`/api/orders/${orderId}/pack`)
                .send({
                    tamperSealVerified: true,
                    packerNotes: 'Batches PCM-2026 verified. 15-day course (2 strips) packed in tamper-proof pouch.'
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('queued for dispatch');
            expect(mockOrder.status).toBe('Ready for Dispatch');
            expect(mockOrder.statusHistory.length).toBe(1);
            expect(mockOrder.statusHistory[0].status).toBe('Ready for Dispatch');
            expect(mockOrder.statusHistory[0].note).toContain('Seal Verified: Yes');
            expect(mockOrder.statusHistory[0].note).toContain('Vikram Packer');
            expect(mockOrder.save).toHaveBeenCalled();
        });

        it('[Positive] should record status note properly when tamperSealVerified is false', async () => {
            const orderId = new mongoose.Types.ObjectId();
            const mockOrder = {
                _id: orderId,
                status: 'Ready for Packing',
                statusHistory: [],
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

            const res = await request(app)
                .post(`/api/orders/${orderId}/pack`)
                .send({
                    tamperSealVerified: false,
                    packerNotes: 'Packaging seal unavailable, secondary taped.'
                });

            expect(res.status).toBe(200);
            expect(mockOrder.status).toBe('Ready for Dispatch');
            expect(mockOrder.statusHistory[0].note).toContain('Seal Verified: No');
        });

        it('[Negative] should return 404 when attempting to pack a non-existent order', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            jest.spyOn(Order, 'findById').mockResolvedValue(null);

            const res = await request(app)
                .post(`/api/orders/${nonExistentId}/pack`)
                .send({ tamperSealVerified: true });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Order not found');
        });

        it('[Negative] should return 500 when database error occurs during pack saving', async () => {
            const orderId = new mongoose.Types.ObjectId();
            const mockOrder = {
                _id: orderId,
                status: 'Ready for Packing',
                statusHistory: [],
                save: jest.fn().mockRejectedValue(new Error('Disk write error on packing console'))
            };

            jest.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

            const res = await request(app)
                .post(`/api/orders/${orderId}/pack`)
                .send({ tamperSealVerified: true });

            expect(res.status).toBe(500);
            expect(res.body.message).toBe('Disk write error on packing console');
        });
    });
});
