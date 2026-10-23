const request = require('supertest');
const express = require('express');
const orderRoutes = require('../src/routes/orderRoutes');
const Order = require('../src/models/Order');
const User = require('../src/models/User');

// Mock Auth
jest.mock('../src/middlewares/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { _id: 'admin123', name: 'Pharmacist Admin', role: 'Admin' };
        next();
    },
    checkPermission: () => (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('FR-05 & Workflow B: Advance Orders, Restock Queue & Dynamic Price Hike', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Dynamic Price Hike Recalculation on Restock Arrival', () => {
        test('POSITIVE: Recalculates balance due correctly when new batch MRP increases (₹110 old, ₹55 advance, ₹130 new = ₹75 balance)', async () => {
            const mockOrder = {
                _id: 'ord_adv_1',
                totalAmount: 110,
                advancePaymentDetails: {
                    isAdvanceOrder: true,
                    tokenPercentage: 50,
                    advanceAmountPaid: 55,
                    balanceDue: 0
                },
                financials: { subtotal: 110 },
                statusHistory: [],
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

            const res = await request(app)
                .post('/api/orders/ord_adv_1/recalculate-price')
                .send({
                    revisedTotal: 130
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Price recalculated');
            // Mathematical formula check: Balance Due = New Total (130) - Advance Paid (55) = 75
            expect(mockOrder.totalAmount).toBe(130);
            expect(mockOrder.advancePaymentDetails.balanceDue).toBe(75);
            expect(mockOrder.advancePaymentDetails.revisedTotalOnArrival).toBe(130);
            expect(mockOrder.status).toBe('Ready for Packing');
            expect(mockOrder.save).toHaveBeenCalled();
        });

        test('NEGATIVE: should return 404 when recalculating price for non-existent order', async () => {
            jest.spyOn(Order, 'findById').mockResolvedValue(null);

            const res = await request(app)
                .post('/api/orders/invalid_order_id/recalculate-price')
                .send({ revisedTotal: 150 });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Order not found');
        });
    });

    describe('1-Click Advance Refund SLA (Procurement Timeframe Limit Exceeded)', () => {
        test('POSITIVE: should refund advance token back to customer wallet and cancel order', async () => {
            const mockUser = {
                _id: 'user_pat_1',
                walletBalance: 200,
                save: jest.fn().mockResolvedValue(true)
            };

            const mockOrder = {
                _id: 'ord_adv_2',
                user: mockUser,
                advancePaymentDetails: {
                    isAdvanceOrder: true,
                    advanceAmountPaid: 150,
                    refundStatus: 'None'
                },
                paymentDetails: { status: 'Partially Paid' },
                statusHistory: [],
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Order, 'findById').mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockOrder)
            });

            const res = await request(app)
                .post('/api/orders/ord_adv_2/refund-advance');

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('₹150 refunded to patient wallet');
            // Wallet should increase by advance paid: 200 + 150 = 350
            expect(mockUser.walletBalance).toBe(350);
            expect(mockOrder.status).toBe('Cancelled');
            expect(mockOrder.advancePaymentDetails.refundStatus).toBe('Processed');
            expect(mockOrder.paymentDetails.status).toBe('Refunded');
            expect(mockUser.save).toHaveBeenCalled();
            expect(mockOrder.save).toHaveBeenCalled();
        });

        test('NEGATIVE: should return 404 when refunding non-existent advance order', async () => {
            jest.spyOn(Order, 'findById').mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const res = await request(app)
                .post('/api/orders/invalid_id/refund-advance');

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Order not found');
        });
    });

    describe('Restocked Queue Listing', () => {
        test('POSITIVE: should fetch only restocked advance orders ready for packing', async () => {
            const mockRestocked = [
                {
                    _id: 'ord_restocked_1',
                    advancePaymentDetails: { isAdvanceOrder: true, advanceAmountPaid: 50 },
                    status: 'Ready for Packing'
                }
            ];

            jest.spyOn(Order, 'find').mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(mockRestocked)
                    })
                })
            });

            const res = await request(app).get('/api/orders/advance-orders/restocked');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0].status).toBe('Ready for Packing');
        });
    });
});
