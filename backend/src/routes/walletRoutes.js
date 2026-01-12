const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { protect } = require('../middlewares/authMiddleware');

// @desc    Get My Wallet Balance & Stats
// @route   GET /api/wallet/my
router.get('/my', protect, async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ user: req.user._id });
        if (!wallet) {
            // Create empty wallet if first time
            wallet = await Wallet.create({ user: req.user._id });
        }
        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get My Transactions
// @route   GET /api/wallet/transactions
router.get('/transactions', protect, async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ user: req.user._id });
        if (!wallet) return res.json([]);

        const transactions = await Transaction.find({ wallet: wallet._id })
            .sort({ createdAt: -1 }); // Newest first

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
