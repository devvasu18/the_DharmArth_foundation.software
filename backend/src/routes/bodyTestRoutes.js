const express = require('express');
const router = express.Router();
const bodyTestController = require('../controllers/bodyTestController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', bodyTestController.getAllBodyTests);
router.get('/:id', bodyTestController.getBodyTestById);

// Admin routes
router.post('/', protect, adminOnly, bodyTestController.createBodyTest);
router.put('/:id', protect, adminOnly, bodyTestController.updateBodyTest);
router.delete('/:id', protect, adminOnly, bodyTestController.deleteBodyTest);

module.exports = router;
