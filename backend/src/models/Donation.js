const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donorName: { type: String, required: true },
    donorMobile: { type: String, required: true },
    donorEmail: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },

    // Commission / Referral info
    motivatorMobile: { type: String },
    referralSource: { type: String },

    // Tax Info
    panNumber: { type: String },
    aadhaarNumber: { type: String },

    transactionId: { type: String }, // Gateway ID
    is80G: { type: Boolean, default: false, index: true },

    // Optimized Filtering Fields
    level1UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // The Motivator
    level2UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // The Motivator's Referrer

}, {
    timestamps: true
});

module.exports = mongoose.model('Donation', donationSchema);
