const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// Public routes
router.get('/emergency', doctorController.getEmergencyDoctors);
router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);

// Admin routes (add authentication middleware as needed)
router.post('/', doctorController.createDoctor);
router.put('/:id', doctorController.updateDoctor);
router.delete('/:id', doctorController.deleteDoctor);
router.patch('/:id/emergency', doctorController.toggleEmergencyAvailability);

module.exports = router;
