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

        // 2. Get Network Stats in Parallel (Unique Donors)
        const [l1Donors, l2Donors] = await Promise.all([
            Donation.distinct('donorMobile', { level1UserId: req.user._id, status: 'success' }),
            Donation.distinct('donorMobile', { level2UserId: req.user._id, status: 'success' })
        ]);

        res.json({
            wallet,
            stats: {
                l1Donors: l1Donors.length,
                l2Donors: l2Donors.length
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
            receiptNumber: d.receiptNumber,
            is80G: d.is80G,
            is80GUploaded: d.is80GUploaded,
            certificate80GUrl: d.certificate80GUrl
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

        // 1. Level 1 Donors (Unique successful donors where user is Level 1)
        const l1Donors = await Donation.distinct('donorMobile', {
            level1UserId: req.user._id,
            status: 'success'
        });

        // 2. Level 2 Donors (Unique successful donors where user is Level 2)
        const l2Donors = await Donation.distinct('donorMobile', {
            level2UserId: req.user._id,
            status: 'success'
        });

        // 3. Wallet summary
        const wallet = await Wallet.findOne({ user: req.user._id });

        res.json({
            l1Donors: l1Donors.length,
            l2Donors: l2Donors.length,
            totalEarned: wallet?.totalEarned || 0,
            balance: wallet?.balance || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get L1 Donors List (Aggregated by donor with total earnings + Filters)
// @route   GET /api/wallet/l1-donors
router.get('/l1-donors', protect, async (req, res) => {
    try {
        const Donation = require('../models/Donation');
        const Setting = require('../models/Setting');

        const { month, year } = req.query;

        // Fetch L1 Commission Rate
        const l1RateSetting = await Setting.findOne({ key: 'commission_level_1' });
        const l1Rate = l1RateSetting ? l1RateSetting.value : 10;

        // 1. Calculate Summary Stats (Lifetime and Previous Month)
        const now = new Date();
        const firstOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const [lifetimeStats, prevMonthStats] = await Promise.all([
            Donation.aggregate([
                { $match: { level1UserId: req.user._id, status: 'success' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Donation.aggregate([
                { 
                    $match: { 
                        level1UserId: req.user._id, 
                        status: 'success',
                        createdAt: { $gte: firstOfPrevMonth, $lte: lastOfPrevMonth }
                    } 
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])
        ]);

        const summary = {
            lifetimeEarning: (lifetimeStats[0]?.total || 0) * (l1Rate / 100),
            prevMonthEarning: (prevMonthStats[0]?.total || 0) * (l1Rate / 100)
        };

        // 2. Prepare Aggregation Pipeline for the List
        let matchQuery = {
            level1UserId: req.user._id,
            status: 'success'
        };

        if (month && year && Number(month) > 0) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 1);
            matchQuery.createdAt = { $gte: start, $lt: end };
        } else if (year) {
            const start = new Date(year, 0, 1);
            const end = new Date(Number(year) + 1, 0, 1);
            matchQuery.createdAt = { $gte: start, $lt: end };
        }

        const donors = await Donation.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { name: "$donorName", mobile: "$donorMobile" },
                    totalAmount: { $sum: "$amount" },
                    lastDonation: { $max: "$createdAt" }
                }
            },
            {
                $project: {
                    _id: 0,
                    donorName: "$_id.name",
                    donorMobile: "$_id.mobile",
                    totalAmount: 1,
                    totalEarning: { $multiply: ["$totalAmount", l1Rate / 100] },
                    lastDonation: 1
                }
            },
            { $sort: { lastDonation: -1 } }
        ]);
        
        res.json({
            summary,
            donors
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get L2 Donors List (Aggregated by donor with total earnings + Filters)
// @route   GET /api/wallet/l2-donors
router.get('/l2-donors', protect, async (req, res) => {
    try {
        const Donation = require('../models/Donation');
        const Setting = require('../models/Setting');

        const { month, year } = req.query;

        // Fetch L2 Commission Rate
        const l2RateSetting = await Setting.findOne({ key: 'commission_level_2' });
        const l2Rate = l2RateSetting ? l2RateSetting.value : 5; // Default 5% if not set

        // 1. Calculate Summary Stats (Lifetime and Previous Month)
        const now = new Date();
        const firstOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const [lifetimeStats, prevMonthStats] = await Promise.all([
            Donation.aggregate([
                { $match: { level2UserId: req.user._id, status: 'success' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Donation.aggregate([
                { 
                    $match: { 
                        level2UserId: req.user._id, 
                        status: 'success',
                        createdAt: { $gte: firstOfPrevMonth, $lte: lastOfPrevMonth }
                    } 
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])
        ]);

        const summary = {
            lifetimeEarning: (lifetimeStats[0]?.total || 0) * (l2Rate / 100),
            prevMonthEarning: (prevMonthStats[0]?.total || 0) * (l2Rate / 100)
        };

        // 2. Prepare Aggregation Pipeline for the List
        let matchQuery = {
            level2UserId: req.user._id,
            status: 'success'
        };

        if (month && year && Number(month) > 0) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 1);
            matchQuery.createdAt = { $gte: start, $lt: end };
        } else if (year) {
            const start = new Date(year, 0, 1);
            const end = new Date(Number(year) + 1, 0, 1);
            matchQuery.createdAt = { $gte: start, $lt: end };
        }

        const donors = await Donation.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { name: "$donorName", mobile: "$donorMobile", l1Id: "$level1UserId" },
                    totalAmount: { $sum: "$amount" },
                    lastDonation: { $max: "$createdAt" }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.l1Id',
                    foreignField: '_id',
                    as: 'l1User'
                }
            },
            { $unwind: "$l1User" },
            {
                $project: {
                    _id: 0,
                    donorName: "$_id.name",
                    donorMobile: "$_id.mobile",
                    referredBy: "$l1User.name",
                    totalAmount: 1,
                    totalEarning: { $multiply: ["$totalAmount", l2Rate / 100] },
                    lastDonation: 1
                }
            },
            { $sort: { lastDonation: -1 } }
        ]);
        
        res.json({
            summary,
            donors
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
