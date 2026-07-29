const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.get('/search', availabilityController.getAvailabilitySearch);
router.get('/week', availabilityController.getWeekAvailability);
router.get('/date/:date', availabilityController.getAvailabilityByDate);
router.get('/', availabilityController.getAvailability);

// Admin routes (add authentication middleware as needed)
router.post('/', availabilityController.upsertAvailability);
router.post('/bulk', availabilityController.bulkCreateAvailability);
router.post('/toggle-daily', protect, availabilityController.toggleDailyAvailability);
router.post('/publish', protect, availabilityController.publishAvailability);
router.delete('/:id', availabilityController.deleteAvailability);

module.exports = router;
