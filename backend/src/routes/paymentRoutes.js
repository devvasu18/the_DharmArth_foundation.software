const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-order', paymentController.createOrder);
router.post('/verify-payment', paymentController.verifyPayment);
router.post('/verify-subscription', paymentController.verifySubscription);
router.post('/webhook', paymentController.handleWebhook);
router.post('/mark-failed', paymentController.markFailed);

module.exports = router;
