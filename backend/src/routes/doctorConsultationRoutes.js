const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @desc    Get all pending doctor consultations (Schedule H/H1 or requested permission)
 * @route   GET /api/doctor/consultations
 * @access  Private (Doctor / Admin)
 */
router.get('/consultations', protect, async (req, res) => {
    try {
        const statusFilter = req.query.status || 'Pending';
        const query = {
            'doctorConsultation.required': true
        };
        if (statusFilter !== 'All') {
            query['doctorConsultation.status'] = statusFilter;
        }

        const prescriptions = await Prescription.find(query)
            .populate('user', 'name mobile')
            .sort({ createdAt: -1 });

        res.json(prescriptions);
    } catch (error) {
        console.error('Error fetching doctor consultations:', error);
        res.status(500).json({ message: 'Failed to fetch doctor consultations' });
    }
});

/**
 * @desc    Submit doctor decision (Approve / Reject) with endorsement notes
 * @route   POST /api/doctor/consultations/:id/decision
 * @access  Private (Doctor / Admin)
 */
router.post('/consultations/:id/decision', protect, async (req, res) => {
    try {
        const { decision, notes, endorsedMedicines } = req.body; // decision: 'Approved' | 'Rejected'
        if (!['Approved', 'Rejected'].includes(decision)) {
            return res.status(400).json({ message: 'Decision must be Approved or Rejected' });
        }

        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription record not found' });
        }

        prescription.doctorConsultation.status = decision;
        prescription.doctorConsultation.doctorId = req.user._id;
        prescription.doctorConsultation.notes = notes || '';
        prescription.doctorConsultation.decidedAt = new Date();

        if (decision === 'Approved') {
            prescription.status = 'Verified';
            prescription.verificationLog.push({
                status: 'Verified',
                updatedBy: req.user._id,
                note: `Approved by Dr. ${req.user.name}. Consultation notes: ${notes || 'None'}`
            });
        } else {
            prescription.status = 'Rejected';
            prescription.rejectionReason = notes || 'Declined during doctor consultation';
            prescription.verificationLog.push({
                status: 'Rejected',
                updatedBy: req.user._id,
                note: `Declined by Dr. ${req.user.name}. Reason: ${notes}`
            });
        }

        await prescription.save();

        // If approved, notify customer with verified checkout link!
        if (decision === 'Approved') {
            try {
                const populatedPrescription = await Prescription.findById(prescription._id).populate('user');
                if (populatedPrescription && populatedPrescription.user) {
                    const notificationService = require('../services/notificationService');
                    await notificationService.notifyPrescriptionVerifiedUser(
                        populatedPrescription,
                        populatedPrescription.user,
                        req.app.get('io')
                    );
                }
            } catch (notifErr) {
                console.error("Failed to notify user on doctor approval:", notifErr);
            }
        }

        // Also update any linked Order if already created
        const linkedOrder = await Order.findOne({ prescription: prescription._id });
        if (linkedOrder) {
            linkedOrder.doctorConsultation.status = decision;
            linkedOrder.doctorConsultation.doctorId = req.user._id;
            linkedOrder.doctorConsultation.decisionNotes = notes || '';
            linkedOrder.doctorConsultation.consultedAt = new Date();
            if (decision === 'Approved') {
                linkedOrder.status = 'Ready for Packing';
            } else {
                linkedOrder.status = 'Cancelled';
            }
            await linkedOrder.save();
        }

        res.json({ message: `Consultation marked as ${decision}`, prescription });
    } catch (error) {
        console.error('Error recording doctor decision:', error);
        res.status(500).json({ message: 'Failed to record decision' });
    }
});

module.exports = router;
