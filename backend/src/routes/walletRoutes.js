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

        const { month, year } = req.query;
        let txnQuery = { wallet: wallet._id };
        let donationQuery = { donorMobile: req.user.mobile, status: 'success' };

        if (Number(month) > 0 && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 1); // First day of next month

            txnQuery.createdAt = { $gte: start, $lt: end };
            donationQuery.createdAt = { $gte: start, $lt: end };
        } else if (year) {
            // All months for the selected year
            const start = new Date(year, 0, 1);
            const end = new Date(Number(year) + 1, 0, 1);
            txnQuery.createdAt = { $gte: start, $lt: end };
            donationQuery.createdAt = { $gte: start, $lt: end };
        }

        // 1. Fetch Wallet Transactions (Commissions, Payouts)
        const walletTxns = await Transaction.find(txnQuery).lean();

        // 2. Fetch User Donations (Donation by Me)
        const Donation = require('../models/Donation');
        const donations = await Donation.find(donationQuery).lean();

        // 3. Format Donations to mimic Transactions
        const formattedDonations = donations.map(d => ({
            _id: d._id,
            description: `Donation to Platform`,
            amount: d.amount,
            type: 'debit', // Treat as debit
            status: 'success',
            createdAt: d.createdAt,
            isDonation: true
        }));

        // 4. Merge and Sort
        const allTransactions = [...walletTxns, ...formattedDonations].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json(allTransactions);
    } catch (error) {
        console.error("Txn Fetch Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
