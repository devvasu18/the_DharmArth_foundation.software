const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { protect } = require('../middlewares/authMiddleware');

// @desc    Get Wallet Summary (Balance, Stats, Total Earned)
// @route   GET /api/wallet/summary
router.get('/summary', protect, async (req, res) => {
    try {
        const Wallet = require('../models/Wallet');
        const Donation = require('../models/Donation');

        // 1. Get/Create Wallet
        let wallet = await Wallet.findOne({ user: req.user._id });
        if (!wallet) {
            wallet = await Wallet.create({ user: req.user._id });
        }

        // 2. Get Network Stats in Parallel
        const [l1Count, l2Count] = await Promise.all([
            Donation.countDocuments({ level1UserId: req.user._id, status: 'success' }),
            Donation.countDocuments({ level2UserId: req.user._id, status: 'success' })
        ]);

        res.json({
            wallet,
            stats: {
                l1Donors: l1Count,
                l2Donors: l2Count
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Keep /my for backward compatibility if needed, but internally it's consolidated in /summary
router.get('/my', protect, async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ user: req.user._id });
        if (!wallet) wallet = await Wallet.create({ user: req.user._id });
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

        // 1.1 Enrich Payout Transactions with Help Resolution Status
        const payoutIds = walletTxns
            .filter(t => t.reason === 'payout' && t.referenceId)
            .map(t => t.referenceId);

        if (payoutIds.length > 0) {
            const PayoutRequest = require('../models/PayoutRequest');
            const payouts = await PayoutRequest.find({ _id: { $in: payoutIds } }).select('isHelpResolved').lean();
            const payoutMap = payouts.reduce((acc, p) => {
                acc[p._id.toString()] = p.isHelpResolved;
                return acc;
            }, {});

            walletTxns.forEach(t => {
                if (t.reason === 'payout' && t.referenceId && payoutMap[t.referenceId.toString()]) {
                    t.isHelpResolved = true;
                }
            });
        }

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
            isDonation: true,
            certificateUrl: d.certificateUrl,
            receiptNumber: d.receiptNumber
        }));

        // 4. Merge and Sort
        const allTransactions = [...walletTxns, ...formattedDonations].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        // 5. Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        if (req.query.all === 'true') {
            return res.json({
                transactions: allTransactions,
                totalCount: allTransactions.length
            });
        }
        
        const paginatedTransactions = allTransactions.slice(skip, skip + limit);
        const hasMore = allTransactions.length > (skip + limit);

        res.json({
            transactions: paginatedTransactions,
            hasMore,
            totalCount: allTransactions.length
        });
    } catch (error) {
        console.error("Txn Fetch Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Network Stats (L1/L2 donor counts)
// @route   GET /api/wallet/stats
router.get('/stats', protect, async (req, res) => {
    try {
        const User = require('../models/User');
        const Donation = require('../models/Donation');

        // 1. Level 1 Donors (Successful donations where user is Level 1)
        const l1Count = await Donation.countDocuments({
            level1UserId: req.user._id,
            status: 'success'
        });

        // 2. Level 2 Donors (Successful donations where user is Level 2)
        const l2Count = await Donation.countDocuments({
            level2UserId: req.user._id,
            status: 'success'
        });

        // 3. Wallet summary
        const wallet = await Wallet.findOne({ user: req.user._id });

        res.json({
            l1Donors: l1Count,
            l2Donors: l2Count,
            totalEarned: wallet?.totalEarned || 0,
            balance: wallet?.balance || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
