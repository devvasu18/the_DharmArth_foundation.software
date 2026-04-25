const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donation = require('../models/Donation');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

// @desc    Get Transactions Dashboard Data (Donations)
// @route   GET /api/transactions/dashboard
// @desc    Get Transactions Dashboard Data (Donations)
// @route   GET /api/transactions/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { searchUserId, specificMotivatorIds, is80G, startDate, endDate, sort, _id } = req.query;

        const query = { status: 'success' };
        if (_id) {
            query._id = _id;
        }
        const andConditions = [];

        // Date Filter
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        // 80G Filter
        if (is80G === 'true') {
            andConditions.push({
                $or: [
                    { is80G: true },
                    { panNumber: { $exists: true, $regex: /\S/ } }
                ]
            });
        }

        // --- User Filter Logic (Hybrid: New IDs + Legacy Mobile) ---
        if (specificMotivatorIds) {
            // Checkbox selection: IDs are passed
            const ids = specificMotivatorIds.split(',');

            // Fetch users to get mobiles for legacy matching
            const selectedUsers = await User.find({ _id: { $in: ids } }).select('mobile');

            const legacyMobileConditions = selectedUsers
                .map(u => (u.mobile || '').replace(/\D/g, '').slice(-10))
                .filter(m => m.length >= 10)
                .map(m => ({ motivatorMobile: { $regex: new RegExp(m, 'i') } }));

            andConditions.push({
                $or: [
                    { level1UserId: { $in: ids } },
                    ...legacyMobileConditions
                ]
            });

        } else {
            // commissionFilter Logic (Only when NO specific user is selected)
            const { commissionFilter } = req.query; // 'ALL', 'L1', 'L2'

            if (commissionFilter === 'L1') {
                andConditions.push({
                    $or: [
                        { level1UserId: { $exists: true, $ne: null } },
                        { motivatorMobile: { $exists: true, $ne: null, $ne: "" } }
                    ]
                });
            } else if (commissionFilter === 'L2') {
                // Broad search for L2 candidates (L1 or Motivator might imply L2)
                // We filter strictly in-memory after polyfilling
                andConditions.push({
                    $or: [
                        { level1UserId: { $exists: true, $ne: null } },
                        { motivatorMobile: { $exists: true, $ne: null, $ne: "" } },
                        { level2UserId: { $exists: true, $ne: null } }
                    ]
                });
            }
        }

        if (searchUserId) {
            // "Involved" User: Search by Transaction Type
            const { type } = req.query; // 'ALL', 'DONATION', 'COMMISSION'
            const searchUser = await User.findById(searchUserId);

            if (searchUser) {
                const cleanUserMobile = (searchUser.mobile || '').replace(/\D/g, '').slice(-10);
                const userMobileRegex = new RegExp(cleanUserMobile, 'i');

                // 1. Commission Conditions (User is Motivator or L2)
                const commissionConditions = [];

                // Direct L1/L2 ID Match
                commissionConditions.push({ level1UserId: searchUserId });
                commissionConditions.push({ level2UserId: searchUserId });

                // Legacy L1 Match (Motivator Mobile = User Mobile)
                commissionConditions.push({ motivatorMobile: { $regex: userMobileRegex } });

                // Legacy L2 Match (Motivator is User's Downline)
                const downlineUsers = await User.find({ referredBy: searchUserId }).select('mobile');
                const downlineConditions = downlineUsers
                    .map(u => (u.mobile || '').replace(/\D/g, '').slice(-10))
                    .filter(m => m.length >= 10)
                    .map(m => ({ motivatorMobile: { $regex: new RegExp(m, 'i') } }));

                if (downlineConditions.length > 0) {
                    commissionConditions.push(...downlineConditions);
                }

                // 2. Donation Conditions (User is Donor)
                const donationConditions = [
                    { donorMobile: { $regex: userMobileRegex } } // Match Donor Mobile
                    // If we had donorId, we'd add { donorId: searchUserId }
                ];

                // 3. Combine based on Type
                if (type === 'DONATION') {
                    andConditions.push({ $or: donationConditions });
                } else if (type === 'COMMISSION') {
                    andConditions.push({ $or: commissionConditions });
                } else {
                    // ALL (Default) -> Either Commission OR Donation
                    andConditions.push({
                        $or: [...commissionConditions, ...donationConditions]
                    });
                }

            } else {
                // Fallback if user not found (shouldn't happen with valid ID)
                andConditions.push({
                    $or: [{ level1UserId: searchUserId }, { level2UserId: searchUserId }]
                });
            }
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        // Fetch Data
        let donations = await Donation.find(query)
            .select('donorName donorMobile amount address city state motivatorMobile createdAt is80G level1UserId level2UserId status panNumber aadhaarNumber transactionId orderId')
            .populate({
                path: 'level1UserId',
                select: 'name mobile referredBy', // Fetch L2 Relation
                populate: { path: 'referredBy', select: 'name mobile' } // Fetch L2 Details
            })
            .populate('level2UserId', 'name mobile') // Populate L2 if exists directly
            .sort({ createdAt: (sort === 'asc' || sort === 'oldest') ? 1 : -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean for performance & modification

        // --- Post-Processing: Fill Missing Motivator Data & 80G ---

        // 1. First, Polyfill L2 from existing L1 (Hybrid Fix)
        donations.forEach(d => {
            if (d.level1UserId && !d.level2UserId && d.level1UserId.referredBy) {
                // If L1 exists but L2 is missing, but L1 HAS a referrer... fill it!
                d.level2UserId = d.level1UserId.referredBy;
            }
        });

        // 2. Collect mobiles of donations that lack 'level1UserId' but have 'motivatorMobile' (Legacy Fix)
        const missingMotivatorMobiles = [...new Set(
            donations
                .filter(d => !d.level1UserId && d.motivatorMobile)
                .map(d => d.motivatorMobile)
        )];

        if (missingMotivatorMobiles.length > 0) {
            // Fetch users for these mobiles AND their referrers (L2)
            const usersFound = await User.find({ mobile: { $in: missingMotivatorMobiles } })
                .select('name mobile referredBy')
                .populate('referredBy', 'name mobile'); // Get the L2 User

            const userMap = {};
            usersFound.forEach(u => {
                userMap[u.mobile] = u;
            });

            // Patch the donations
            donations = donations.map(d => {
                // Polyfill L1 & L2
                if (!d.level1UserId && d.motivatorMobile) {
                    const foundUser = userMap[d.motivatorMobile];
                    if (foundUser) {
                        d.level1UserId = foundUser; // L1
                        if (foundUser.referredBy) {
                            d.level2UserId = foundUser.referredBy; // L2
                        }
                    }
                }
                return d;
            });
        }

        // 80G Inference for Legacy Data (if PAN exists, treat as 80G)
        const { decrypt } = require('../utils/security');
        donations = donations.map(d => {
            // Decrypt fields since .lean() bypasses getters
            if (d.panNumber) d.panNumber = decrypt(d.panNumber);
            if (d.aadhaarNumber) d.aadhaarNumber = decrypt(d.aadhaarNumber);

            if (!d.is80G && d.panNumber && d.panNumber.trim() !== '') {
                return { ...d, is80G: true }; // Infer 80G if PAN is present but flag is false
            }
            return d;
        });

        // --- Final Filter: Ensure Commission Criteria is Met (Visual Check) ---
        // This handles cases where populate returned null (orphaned ID) but DB query included it.
        const { commissionFilter } = req.query;
        if (commissionFilter === 'L1') {
            donations = donations.filter(d => (d.level1UserId && typeof d.level1UserId === 'object') || (d.motivatorMobile && d.motivatorMobile.trim() !== ''));
        } else if (commissionFilter === 'L2') {
            donations = donations.filter(d => d.level2UserId && typeof d.level2UserId === 'object');
        }

        const total = await Donation.countDocuments(query);

        res.json({
            data: donations,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalRecords: total
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get paginated users for "ALL" mode
router.get('/users/paginated', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('name mobile email referredBy createdAt')
            .populate('referredBy', 'name mobile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();

        res.json({
            users,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalUsers: total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search users by name or mobile
router.get('/users/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.json({ users: [] });
        }

        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { mobile: { $regex: query, $options: 'i' } }
            ]
        })
            .select('name mobile email referredBy createdAt')
            .populate('referredBy', 'name mobile')
            .limit(20);

        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's referral tree (direct + level 2)
router.get('/users/:userId/referral-tree', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get the selected user
        const user = await User.findById(userId)
            .select('name mobile email referredBy createdAt')
            .populate('referredBy', 'name mobile');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get direct referrals (Level 1)
        const level1Users = await User.find({ referredBy: userId })
            .select('name mobile email createdAt')
            .sort({ createdAt: -1 });

        // Get Level 2 referrals (people referred by Level 1 users)
        const level2Data = [];
        for (const l1User of level1Users) {
            const l2Users = await User.find({ referredBy: l1User._id })
                .select('name mobile email createdAt')
                .sort({ createdAt: -1 });

            level2Data.push({
                level1User: l1User,
                level2Users: l2Users
            });
        }

        res.json({
            user,
            level1Users,
            level2Data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's transaction breakdown
router.get('/users/:userId/transactions', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('name mobile email');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate Total Donated by this user (based on mobile)
        // Robust strategy: Match the last 10 digits of the user's mobile number
        const cleanUserMobile = (user.mobile || '').replace(/\D/g, '').slice(-10);
        const searchRegex = new RegExp(cleanUserMobile, 'i');

        const totalDonatedData = await Donation.aggregate([
            {
                $match: {
                    donorMobile: { $regex: searchRegex },
                    status: 'success'
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalDonated = totalDonatedData.length > 0 ? totalDonatedData[0].total : 0;

        // Get user's wallet (if exists)
        const wallet = await Wallet.findOne({ user: userId });

        let enrichedTransactions = [];
        let totalWithdrawn = 0;
        let totalEarned = 0;
        let currentBalance = 0;

        // 1. Get Wallet Transactions (Commissions & Withdrawals)
        let walletTransactions = [];
        if (wallet) {
            totalEarned = wallet.totalEarned || 0;
            currentBalance = wallet.balance || 0;

            const rawTransactions = await Transaction.find({ wallet: wallet._id })
                .sort({ createdAt: -1 })
                .lean();

            // Enrich wallet transactions with commission details
            walletTransactions = await Promise.all(
                rawTransactions.map(async (txn) => {
                    if (txn.referenceId && txn.reason.includes('referral_commission')) {
                        const donation = await Donation.findById(txn.referenceId)
                            .select('donorName donorMobile amount motivatorMobile createdAt');

                        if (donation) {
                            const motivator = await User.findOne({ mobile: donation.motivatorMobile })
                                .select('name mobile');
                            let level1Motivator = null;
                            if (txn.reason === 'referral_commission_l2' && motivator) {
                                level1Motivator = motivator;
                            }

                            return {
                                ...txn,
                                donation: {
                                    ...donation.toObject(),
                                    motivator: motivator ? motivator.toObject() : null,
                                    level1Motivator: level1Motivator ? level1Motivator.toObject() : null
                                }
                            };
                        }
                    }
                    return txn;
                })
            );

            // Calculate total withdrawn
            const totalWithdrawnData = await Transaction.aggregate([
                { $match: { wallet: wallet._id, type: 'debit' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            totalWithdrawn = totalWithdrawnData.length > 0 ? totalWithdrawnData[0].total : 0;
        }

        // 2. Get Personal Donations (Direct payments by this user)
        const rawPersonalDonations = await Donation.find({
            donorMobile: { $regex: searchRegex },
            status: 'success'
        }).lean();

        const { decrypt } = require('../utils/security');
        const donationTransactions = rawPersonalDonations.map(d => ({
            _id: d._id,
            amount: d.amount,
            type: 'debit',
            reason: 'personal_donation',
            description: `Personal Donation to Foundation`,
            createdAt: d.createdAt,
            transactionId: d.transactionId,
            panNumber: d.panNumber ? decrypt(d.panNumber) : null,
            aadhaarNumber: d.aadhaarNumber ? decrypt(d.aadhaarNumber) : null,
            isDonation: true
        }));

        // 3. Merge and Final Sort
        const allTransactions = [...walletTransactions, ...donationTransactions].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({
            user,
            transactions: allTransactions,
            totalEarned,
            currentBalance,
            totalWithdrawn,
            totalDonated
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get detailed transaction breakdown for a specific donation
router.get('/donations/:donationId/breakdown', async (req, res) => {
    try {
        const { donationId } = req.params;

        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        // Find all transactions related to this donation
        const transactions = await Transaction.find({ referenceId: donationId })
            .populate({
                path: 'wallet',
                populate: {
                    path: 'user',
                    select: 'name mobile email'
                }
            })
            .sort({ createdAt: 1 });

        const breakdown = {
            donation: {
                id: donation._id,
                donorName: donation.donorName,
                donorMobile: donation.donorMobile,
                address: donation.address,
                city: donation.city,
                state: donation.state,
                amount: donation.amount,
                date: donation.createdAt,
                panNumber: donation.panNumber, // Getters handle this since it's not .lean()
                aadhaarNumber: donation.aadhaarNumber
            },
            commissions: transactions.map(txn => ({
                recipient: txn.wallet.user,
                amount: txn.amount,
                percentage: txn.reason === 'referral_commission_l1' ? 10 : 3,
                level: txn.reason === 'referral_commission_l1' ? 1 : 2,
                description: txn.description
            }))
        };

        res.json(breakdown);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's network statistics (Network View)
router.get('/users/:userId/network-stats', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // --- Helper Function to get stats for a single referral ---
        const getReferralStats = async (referralUser, level) => {
            const cleanRefMobile = (referralUser.mobile || '').replace(/\D/g, '').slice(-10);
            const searchRefRegex = new RegExp(cleanRefMobile, 'i');

            // 1. Total Amount Donated by this referral
            const donationStats = await Donation.aggregate([
                {
                    $match: {
                        donorMobile: { $regex: searchRefRegex },
                        status: 'success'
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalDonated = donationStats.length > 0 ? donationStats[0].total : 0;

            // 2. Total Commission Earned FROM this referral BY the current user (userId)
            // We need to look for transactions in current user's wallet
            // where reason matches the level and the donation was made by the referralUser
            // (Transaction -> referenceId (Donation) -> donorMobile matches referralUser.mobile)

            // Find current user's wallet
            const currentUserWallet = await Wallet.findOne({ user: userId });
            let totalEarnedFrom = 0;

            if (currentUserWallet) {
                // Find all successful donations by the referralUser
                const referralDonations = await Donation.find({
                    donorMobile: { $regex: searchRefRegex },
                    status: 'success'
                }).select('_id');

                const referralDonationIds = referralDonations.map(d => d._id.toString());

                if (referralDonationIds.length > 0) {
                    const commissionReason = level === 'Level 1' ? 'referral_commission_l1' : 'referral_commission_l2';

                    const earnStats = await Transaction.aggregate([
                        {
                            $match: {
                                wallet: currentUserWallet._id,
                                reason: commissionReason,
                                referenceId: { $in: referralDonationIds }
                            }
                        },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ]);
                    totalEarnedFrom = earnStats.length > 0 ? earnStats[0].total : 0;
                }
            }

            return {
                _id: referralUser._id,
                name: referralUser.name,
                mobile: referralUser.mobile,
                avatar: referralUser.name.charAt(0).toUpperCase(),
                level: level,
                joinedDate: referralUser.createdAt,
                totalDonated,
                totalEarnedFrom
            };
        };

        const networkList = [];

        // 1. Get Direct Referrals (Level 1)
        const level1Users = await User.find({ referredBy: userId });
        for (const l1User of level1Users) {
            const stats = await getReferralStats(l1User, 'Level 1');
            networkList.push(stats);

            // 2. Get Indirect Referrals (Level 2) - Users referred by this l1User
            const level2Users = await User.find({ referredBy: l1User._id });
            for (const l2User of level2Users) {
                const l2Stats = await getReferralStats(l2User, 'Level 2');
                networkList.push(l2Stats);
            }
        }

        res.json({ network: networkList });

    } catch (error) {
        console.error('Error fetching network stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get Commission Reports Data
// @route   GET /api/transactions/commission-reports
router.get('/commission-reports', async (req, res) => {
    try {
        const { startDate, endDate, period } = req.query; // period: 'day', 'month'

        // Date Filter Construction
        let dateQuery = {};
        if (startDate && endDate) {
            dateQuery = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                }
            };
        }

        // 1. Summary Cards Data
        // Total Donations (Success)
        const totalDonationsAgg = await Donation.aggregate([
            { $match: { status: 'success', ...dateQuery } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalDonations = totalDonationsAgg[0]?.total || 0;

        // Total Commissions Paid
        const commissionAgg = await Transaction.aggregate([
            {
                $match: {
                    reason: { $in: ['referral_commission_l1', 'referral_commission_l2'] },
                    ...dateQuery
                }
            },
            {
                $group: {
                    _id: '$reason',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const l1Commission = commissionAgg.find(c => c._id === 'referral_commission_l1')?.total || 0;
        const l2Commission = commissionAgg.find(c => c._id === 'referral_commission_l2')?.total || 0;
        const totalCommissionPaid = l1Commission + l2Commission;
        const platformBalance = totalDonations - totalCommissionPaid;

        // Pending Commission (Estimate from Pending Donations)
        const pendingDonationsAgg = await Donation.aggregate([
            { $match: { status: 'pending', ...dateQuery } },
            { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);
        const totalPendingDonations = pendingDonationsAgg[0]?.totalAmount || 0;
        const pendingCount = pendingDonationsAgg[0]?.count || 0;
        const estimatedPendingCommission = (totalPendingDonations * 0.10) + (totalPendingDonations * 0.03);

        // 2. Charts Data
        // Distro Pie Chart handled by l1Commission/l2Commission

        // Trend Chart (Monthly/Daily)
        const trendFormat = period === 'year' ? '%Y-%m' : '%Y-%m-%d';
        const trendAgg = await Transaction.aggregate([
            {
                $match: {
                    reason: { $in: ['referral_commission_l1', 'referral_commission_l2'] },
                    ...dateQuery
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: trendFormat, date: "$createdAt" } },
                    amount: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Top Performers
        // Helper to populate user info
        const getTopEarners = async (reason) => {
            return await Transaction.aggregate([
                { $match: { reason, ...dateQuery } },
                { $group: { _id: '$wallet', total: { $sum: '$amount' } } },
                { $sort: { total: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'wallets', localField: '_id', foreignField: '_id', as: 'walletInfo' } },
                { $unwind: '$walletInfo' },
                { $lookup: { from: 'users', localField: 'walletInfo.user', foreignField: '_id', as: 'userInfo' } },
                { $unwind: '$userInfo' },
                { $project: { name: '$userInfo.name', mobile: '$userInfo.mobile', total: 1 } }
            ]);
        };

        const topL1 = await getTopEarners('referral_commission_l1');
        const topL2 = await getTopEarners('referral_commission_l2');

        // Highest Donation Source (Top Motivators L1)
        const topSource = await Donation.aggregate([
            { $match: { status: 'success', ...dateQuery, level1UserId: { $exists: true } } },
            { $group: { _id: '$level1UserId', totalDonated: { $sum: '$amount' } } },
            { $sort: { totalDonated: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
            { $unwind: '$userInfo' },
            { $project: { name: '$userInfo.name', mobile: '$userInfo.mobile', totalDonated: 1 } }
        ]);

        // 4. Growth Calculation (Previous Period)
        const startD = new Date(startDate);
        const endD = new Date(endDate);
        const duration = endD.getTime() - startD.getTime();
        const prevEndDate = new Date(startD.getTime() - 1);
        const prevStartDate = new Date(prevEndDate.getTime() - duration);

        const prevCommissionAgg = await Transaction.aggregate([
            {
                $match: {
                    reason: { $in: ['referral_commission_l1', 'referral_commission_l2'] },
                    createdAt: { $gte: prevStartDate, $lte: prevEndDate }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const prevTotalCommission = prevCommissionAgg[0]?.total || 0;

        let commissionGrowth = 0;
        if (prevTotalCommission > 0) {
            commissionGrowth = ((totalCommissionPaid - prevTotalCommission) / prevTotalCommission) * 100;
        } else if (totalCommissionPaid > 0) {
            commissionGrowth = 100;
        }

        // 5. Table Data (Paginated)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const tableDonations = await Donation.find({ status: 'success', ...dateQuery })
            .select('amount createdAt transactionId orderId status level1UserId level2UserId')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        // Calculate commissions for each donation in table
        const detailedTable = tableDonations.map(d => {
            const l1 = d.level1UserId ? d.amount * 0.10 : 0;
            const l2 = d.level2UserId ? d.amount * 0.03 : 0;
            const totalComm = l1 + l2;
            return {
                id: d._id,
                date: d.createdAt,
                transactionId: d.transactionId, // Payment Gateway ID
                amount: d.amount,
                l1Commission: l1,
                l2Commission: l2,
                totalCommission: totalComm,
                platformBalance: d.amount - totalComm,
                status: 'Paid' // since we filtered for success
            };
        });

        const totalTableRecords = await Donation.countDocuments({ status: 'success', ...dateQuery });

        res.json({
            summary: {
                totalDonations,
                totalCommissionPaid,
                l1Commission,
                l2Commission,
                platformBalance,
                pendingAmount: estimatedPendingCommission,
                pendingCount,
                growthPercentage: commissionGrowth
            },
            charts: {
                trend: trendAgg
            },
            insights: {
                topL1,
                topL2,
                topSource
            },
            table: {
                data: detailedTable,
                totalPages: Math.ceil(totalTableRecords / limit),
                totalRecords: totalTableRecords,
                currentPage: page
            }
        });

    } catch (error) {
        console.error('Commission Report Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
