const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0
    },
    totalEarned: {
        type: Number,
        default: 0
    },
    lastPayoutDate: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Wallet', walletSchema);
