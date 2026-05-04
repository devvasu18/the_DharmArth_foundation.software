const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/security');

const payoutRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    walletBalanceAtRequest: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'exported'],
        default: 'pending'
    },
    payoutDetails: {
        bankName: String,
        accountHolder: String,
        accountNumber: {
            type: String,
            get: decrypt,
            set: encrypt
        },
        ifscCode: {
            type: String,
            get: decrypt,
            set: encrypt
        }
    },
    adminNotes: String,
    transactionId: String, // Payment gateway Ref ID
    proofImage: String, // URL of payment proof screenshot
    processedAt: Date,
    isDisputed: {
        type: Boolean,
        default: false
    },
    disputeMessage: String,
    disputedAt: Date,
    isHelpResolved: {
        type: Boolean,
        default: false
    },
    helpResolutionNotes: String,
    helpResolvedAt: Date
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
