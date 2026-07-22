const mongoose = require('mongoose');

const registrationOTPSchema = new mongoose.Schema({
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // 10 minutes
    }
});

const RegistrationOTP = mongoose.model('RegistrationOTP', registrationOTPSchema);

module.exports = RegistrationOTP;
