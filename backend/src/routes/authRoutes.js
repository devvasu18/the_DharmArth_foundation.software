const express = require('express');
const router = express.Router();
const { loginUser, registerUser, checkReferral } = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/check-referral', checkReferral);

module.exports = router;
