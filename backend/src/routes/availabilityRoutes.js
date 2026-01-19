const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');

// Public routes
router.get('/week', availabilityController.getWeekAvailability);
router.get('/date/:date', availabilityController.getAvailabilityByDate);
router.get('/', availabilityController.getAvailability);

// Admin routes (add authentication middleware as needed)
router.post('/', availabilityController.upsertAvailability);
router.post('/bulk', availabilityController.bulkCreateAvailability);
router.delete('/:id', availabilityController.deleteAvailability);

module.exports = router;
