const request = require('supertest');
const express = require('express');
const doctorRoutes = require('../src/routes/doctorConsultationRoutes');
const Prescription = require('../src/models/Prescription');
const Order = require('../src/models/Order');

// Mock Auth Middleware
jest.mock('../src/middlewares/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { _id: 'doc123456789012345678901', name: 'Dr. Ramesh Sharma', role: 'Doctor' };
        next();
    }
}));

// Mock Notification Service
jest.mock('../src/services/notificationService', () => ({
    notifyPrescriptionVerifiedUser: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());
app.use('/api/doctor', doctorRoutes);

describe('FR-02 & Workflow C: Doctor Tele-Consultation & Schedule H/H1 Approval', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/doctor/consultations (Queue Listing)', () => {
        test('POSITIVE: should fetch pending consultations filtered by status', async () => {
            const mockPrescriptions = [
                {
                    _id: 'rx111',
                    guestName: 'Rohan Meena',
                    doctorConsultation: { required: true, status: 'Pending' },
                    verifiedItems: [{ medicineName: 'Alprazolam 0.5mg' }]
                }
            ];

            jest.spyOn(Prescription, 'find').mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockPrescriptions)
                })
            });

            const res = await request(app).get('/api/doctor/consultations?status=Pending');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].doctorConsultation.status).toBe('Pending');
        });

        test('NEGATIVE: should return 500 when database throws an error', async () => {
            jest.spyOn(Prescription, 'find').mockImplementation(() => {
                throw new Error('Database connection failed');
            });

            const res = await request(app).get('/api/doctor/consultations');
            expect(res.statusCode).toBe(500);
            expect(res.body.message).toBe('Failed to fetch doctor consultations');
        });
    });

    describe('POST /api/doctor/consultations/:id/decision (Endorsement Actions)', () => {
        test('POSITIVE: Doctor clicks YES (Approved) ➔ updates prescription to Verified and linked Order to Ready for Packing', async () => {
            const mockPrescription = {
                _id: 'rx111',
                doctorConsultation: { status: 'Pending' },
                verificationLog: [],
                save: jest.fn().mockResolvedValue(true)
            };

            const mockLinkedOrder = {
                _id: 'ord999',
                doctorConsultation: {},
                status: 'Doctor Consultation Pending',
                save: jest.fn().mockResolvedValue(true)
            };

            mockPrescription.populate = jest.fn().mockResolvedValue({ ...mockPrescription, user: { _id: 'u1', mobile: '9876543210' } });
            jest.spyOn(Prescription, 'findById').mockImplementation((id) => {
                if (id === 'rx111') return mockPrescription;
                return null;
            });

            jest.spyOn(Order, 'findOne').mockResolvedValue(mockLinkedOrder);

            const res = await request(app)
                .post('/api/doctor/consultations/rx111/decision')
                .send({
                    decision: 'Approved',
                    notes: 'Dosage evaluated. Patient symptoms match indication.'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Consultation marked as Approved');
            expect(mockPrescription.status).toBe('Verified');
            expect(mockPrescription.doctorConsultation.status).toBe('Approved');
            expect(mockLinkedOrder.status).toBe('Ready for Packing');
            expect(mockPrescription.save).toHaveBeenCalled();
            expect(mockLinkedOrder.save).toHaveBeenCalled();
        });

        test('POSITIVE: Doctor clicks NO (Rejected) with clinical reason ➔ cancels prescription and linked order', async () => {
            const mockPrescription = {
                _id: 'rx222',
                doctorConsultation: { status: 'Pending' },
                verificationLog: [],
                save: jest.fn().mockResolvedValue(true)
            };

            const mockLinkedOrder = {
                _id: 'ord888',
                doctorConsultation: {},
                status: 'Doctor Consultation Pending',
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Prescription, 'findById').mockResolvedValue(mockPrescription);
            jest.spyOn(Order, 'findOne').mockResolvedValue(mockLinkedOrder);

            const res = await request(app)
                .post('/api/doctor/consultations/rx222/decision')
                .send({
                    decision: 'Rejected',
                    notes: 'Inappropriate dosage history; recommend in-person physical assessment.'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Consultation marked as Rejected');
            expect(mockPrescription.status).toBe('Rejected');
            expect(mockPrescription.rejectionReason).toContain('Inappropriate dosage');
            expect(mockLinkedOrder.status).toBe('Cancelled');
        });

        test('NEGATIVE: should reject invalid decision value with 400', async () => {
            const res = await request(app)
                .post('/api/doctor/consultations/rx111/decision')
                .send({
                    decision: 'Maybe Later',
                    notes: 'Unsure'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Decision must be Approved or Rejected');
        });

        test('NEGATIVE: should return 404 if prescription ID is not found', async () => {
            jest.spyOn(Prescription, 'findById').mockResolvedValue(null);

            const res = await request(app)
                .post('/api/doctor/consultations/nonexistent_id/decision')
                .send({
                    decision: 'Approved',
                    notes: 'OK'
                });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Prescription record not found');
        });
    });
});
