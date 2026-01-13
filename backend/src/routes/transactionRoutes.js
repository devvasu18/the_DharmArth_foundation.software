const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donation = require('../models/Donation');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

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

        if (wallet) {
            totalEarned = wallet.totalEarned || 0;
            currentBalance = wallet.balance || 0;

            // Get all transactions for this wallet
            const transactions = await Transaction.find({ wallet: wallet._id })
                .sort({ createdAt: -1 })
                .lean();

            // Enrich transactions with donation details
            enrichedTransactions = await Promise.all(
                transactions.map(async (txn) => {
                    if (txn.referenceId && txn.reason.includes('referral_commission')) {
                        const donation = await Donation.findById(txn.referenceId)
                            .select('donorName donorMobile amount motivatorMobile createdAt');

                        if (donation) {
                            // Find who the motivator was
                            const motivator = await User.findOne({ mobile: donation.motivatorMobile })
                                .select('name mobile');

                            // If this is L2 commission, find the L1 motivator
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

            // Check for total withdrawn
            const totalWithdrawnData = await Transaction.aggregate([
                { $match: { wallet: wallet._id, type: 'debit' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            totalWithdrawn = totalWithdrawnData.length > 0 ? totalWithdrawnData[0].total : 0;
        }

        res.json({
            user,
            transactions: enrichedTransactions,
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
                amount: donation.amount,
                date: donation.createdAt
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

module.exports = router;
