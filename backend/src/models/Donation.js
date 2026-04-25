const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/security');

const donationSchema = new mongoose.Schema({
    donorName: { type: String, required: true, maxlength: 100 },
    donorMobile: { type: String, required: true, maxlength: 20 },
    donorEmail: { type: String, maxlength: 100 },
    address: { type: String, maxlength: 500 },
    city: { type: String, maxlength: 100 },
    state: { type: String, maxlength: 100 },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },

    // Commission / Referral info
    motivatorMobile: { type: String },
    referralSource: { type: String },

    // Tax Info
    panNumber: { 
        type: String, 
        set: encrypt,
        get: decrypt
    },
    aadhaarNumber: { 
        type: String, 
        set: encrypt,
        get: decrypt
    },

    transactionId: { type: String, unique: true, sparse: true }, // Gateway ID (payment_id) - UNIQUE to prevent double processing
    orderId: { type: String, index: true }, // Razorpay Order ID
    is80G: { type: Boolean, default: false, index: true },
    receiptNumber: { type: String, unique: true, sparse: true },
    certificateUrl: { type: String },

    // Optimized Filtering Fields
    level1UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // The Motivator
    level2UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // The Motivator's Referrer

}, {
    timestamps: true,
    toJSON: {
        getters: true,
        transform: (doc, ret) => {
            return ret;
        }
    },
    toObject: {
        getters: true,
        transform: (doc, ret) => {
            return ret;
        }
    }
});

module.exports = mongoose.model('Donation', donationSchema);
