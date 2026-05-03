const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/my', protect, subscriptionController.getMySubscriptions);
router.get('/admin/all', protect, adminOnly, subscriptionController.getAllSubscriptions);
router.post('/request-cancel-otp/:id', protect, adminOnly, subscriptionController.requestCancelSubscriptionOTP);
router.post('/cancel/:id', protect, subscriptionController.cancelSubscription);
router.get('/motivator/referrals', protect, subscriptionController.getMotivatorReferrals);

module.exports = router;
