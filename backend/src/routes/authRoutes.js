const express = require('express');
const router = express.Router();
const { loginUser, registerUser, logoutUser, checkReferral, checkUserStatus, sendOTP, verifyOTP, resetPassword } = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/logout', logoutUser);
router.post('/check-referral', checkReferral);
router.post('/check-status', checkUserStatus);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
