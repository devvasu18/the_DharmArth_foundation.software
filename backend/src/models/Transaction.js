const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    reason: {
        type: String,
        enum: ['referral_commission_l1', 'referral_commission_l2', 'payout'],
        required: true
    },
    referenceId: {
        type: String // e.g., Donation ID or Payout ID
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'success'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
