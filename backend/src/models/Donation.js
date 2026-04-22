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
    panNumber: { type: String },
    aadhaarNumber: { type: String },

    transactionId: { type: String }, // Gateway ID
    is80G: { type: Boolean, default: false, index: true },
    receiptNumber: { type: String, unique: true, sparse: true },
    certificateUrl: { type: String },

    // Optimized Filtering Fields
    level1UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // The Motivator
    level2UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // The Motivator's Referrer

}, {
    timestamps: true
});

// Encryption Hooks
donationSchema.pre('save', async function() {
    if (this.isModified('panNumber')) this.panNumber = encrypt(this.panNumber);
    if (this.isModified('aadhaarNumber')) this.aadhaarNumber = encrypt(this.aadhaarNumber);
});

donationSchema.post('init', function(doc) {
    if (doc.panNumber) doc.panNumber = decrypt(doc.panNumber);
    if (doc.aadhaarNumber) doc.aadhaarNumber = decrypt(doc.aadhaarNumber);
});

module.exports = mongoose.model('Donation', donationSchema);
