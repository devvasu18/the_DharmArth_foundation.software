const express = require('express');
const router = express.Router();
const doctorFaqController = require('../controllers/doctorFaqController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', doctorFaqController.getAllDoctorFaqs);
router.get('/:id', doctorFaqController.getDoctorFaqById);

// Admin routes
router.post('/', protect, adminOnly, doctorFaqController.createDoctorFaq);
router.put('/:id', protect, adminOnly, doctorFaqController.updateDoctorFaq);
router.delete('/:id', protect, adminOnly, doctorFaqController.deleteDoctorFaq);

module.exports = router;
