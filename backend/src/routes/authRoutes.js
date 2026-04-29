const express = require('express');
const router = express.Router();
const { loginUser, registerUser, logoutUser, checkReferral, checkUserStatus } = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/logout', logoutUser);
router.post('/check-referral', checkReferral);
router.post('/check-status', checkUserStatus);

module.exports = router;
