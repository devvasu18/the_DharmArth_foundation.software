const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// Admin routes - bulk updates
router.patch('/bulk-status', doctorController.bulkUpdateStatus);

// Public routes
router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);

// Admin routes (add authentication middleware as needed)
router.post('/', doctorController.createDoctor);
router.put('/:id', doctorController.updateDoctor);
router.delete('/:id', doctorController.deleteDoctor);

module.exports = router;
