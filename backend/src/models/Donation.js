const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/security');

const donationSchema = new mongoose.Schema({
    donorName: { type: String, required: true },
    donorMobile: { type: String, required: true },
    donorEmail: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },

    // Commission / Referral info
    motivatorMobile: { type: String },
    referralSource: { type: String },

    // Tax Info
    panNumber: { 
        type: String, 
        set: encrypt
    },
    aadhaarNumber: { 
        type: String, 
        set: encrypt
    },

    transactionId: { type: String }, // Gateway ID (payment_id)
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
        transform: (doc, ret) => {
            if (ret.panNumber) ret.panNumber = decrypt(ret.panNumber);
            if (ret.aadhaarNumber) ret.aadhaarNumber = decrypt(ret.aadhaarNumber);
            return ret;
        }
    },
    toObject: {
        transform: (doc, ret) => {
            if (ret.panNumber) ret.panNumber = decrypt(ret.panNumber);
            if (ret.aadhaarNumber) ret.aadhaarNumber = decrypt(ret.aadhaarNumber);
            return ret;
        }
    }
});

module.exports = mongoose.model('Donation', donationSchema);
