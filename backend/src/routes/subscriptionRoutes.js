const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/my', protect, subscriptionController.getMySubscriptions);
router.get('/admin/all', protect, adminOnly, subscriptionController.getAllSubscriptions);
router.post('/cancel/:id', protect, subscriptionController.cancelSubscription);

module.exports = router;
