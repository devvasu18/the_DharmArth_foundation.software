const Subscription = require('../models/Subscription');
const razorpay = require('../config/razorpay');
const notificationService = require('../services/notificationService');

/**
 * @desc    Get current user's subscriptions
 * @route   GET /api/subscriptions/my
 * @access  Private
 */
exports.getMySubscriptions = async (req, res) => {
    try {
        const { page = 1, limit = 10, exportAll } = req.query;
        let query = {
            $or: [
                { donorUserId: req.user._id },
                { donorMobile: req.user.mobile }
            ]
        };

        if (exportAll === 'true') {
            const allSubscriptions = await Subscription.find(query).sort({ createdAt: -1 });
            return res.json(allSubscriptions);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalRecords = await Subscription.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        const subscriptions = await Subscription.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            subscriptions,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching my subscriptions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get all subscriptions for admin
 * @route   GET /api/subscriptions/admin/all
 * @access  Private/Admin
 */
exports.getAllSubscriptions = async (req, res) => {
    try {
        const { status, amount, search, page = 1, limit = 10, exportAll } = req.query;
        let query = {};

        if (status) query.status = status;
        if (amount) {
            if (amount.includes('-')) {
                const [min, max] = amount.split('-').map(Number);
                if (!isNaN(min) && !isNaN(max)) {
                    query.amount = { $gte: min, $lte: max };
                }
            } else {
                const parsed = parseInt(amount);
                if (!isNaN(parsed)) {
                    query.amount = parsed;
                }
            }
        }
        if (search) {
            const User = require('../models/User');
            // Find users matching the search as a referral code
            const usersWithCode = await User.find({ 
                referralCode: { $regex: search, $options: 'i' } 
            }).select('_id');
            const userIds = usersWithCode.map(u => u._id);

            query.$or = [
                { donorName: { $regex: search, $options: 'i' } },
                { donorMobile: { $regex: search, $options: 'i' } },
                { subscriptionId: { $regex: search, $options: 'i' } },
                { donorUserId: { $in: userIds } }
            ];
        }

        // If exportAll is true, bypass pagination
        if (exportAll === 'true') {
            const allSubscriptions = await Subscription.find(query)
                .populate('level1UserId', 'name mobile')
                .populate('donorUserId', 'name mobile referralCode')
                .sort({ createdAt: -1 });
            return res.json(allSubscriptions);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalRecords = await Subscription.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        const subscriptions = await Subscription.find(query)
            .populate('level1UserId', 'name mobile')
            .populate('donorUserId', 'name mobile referralCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            subscriptions,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching all subscriptions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Request OTP to cancel subscription (Admin only)
 * @route   POST /api/subscriptions/request-cancel-otp/:id
 * @access  Private/Admin
 */
exports.requestCancelSubscriptionOTP = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

        const User = require('../models/User');
        const whatsappService = require('../services/whatsappService');

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // We store OTP on the donor user if exists, otherwise we need a way to verify it.
        // For simplicity and security, we'll use a temporary "OTP store" or just use the donor user.
        let donorUser = await User.findOne({ mobile: subscription.donorMobile });
        if (!donorUser) {
            // Create a shadow user if not exists to store OTP
            donorUser = await User.create({
                name: subscription.donorName,
                mobile: subscription.donorMobile,
                email: subscription.donorEmail,
                role: 'Donor'
            });
        }

        donorUser.otp = otp;
        donorUser.otpExpires = otpExpires;
        await donorUser.save();

        const success = await whatsappService.sendCancelSubscriptionOTP(subscription.donorMobile, otp, subscription.amount);
        if (success) {
            res.json({ success: true, message: 'OTP sent to donor successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP' });
        }
    } catch (error) {
        console.error('OTP Error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Cancel a subscription
 * @route   POST /api/subscriptions/cancel/:id
 * @access  Private (Owner or Admin with OTP)
 */
exports.cancelSubscription = async (req, res) => {
    try {
        const { otp } = req.body;
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        const isAdmin = req.user.isSuperAdmin || req.user.roles?.some(r => r.name === 'Admin');
        const isOwner = subscription.donorUserId?.toString() === req.user._id.toString() || 
                        subscription.donorMobile === req.user.mobile;
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to cancel' });
        }

        // REQUIRE OTP FOR EVERYONE
        if (!otp) return res.status(400).json({ message: 'OTP is required for subscription cancellation' });
        
        const User = require('../models/User');
        const donorUser = await User.findOne({ mobile: subscription.donorMobile });
        
        if (!donorUser || donorUser.otp !== otp || donorUser.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP after verification
        donorUser.otp = undefined;
        donorUser.otpExpires = undefined;
        await donorUser.save();
        
        if (isAdmin && !isOwner) {
            subscription.cancelledBy = 'admin';
        } else {
            subscription.cancelledBy = 'user';
        }

        if (subscription.status === 'cancelled') {
            return res.status(400).json({ message: 'Already cancelled' });
        }

        // 1. Cancel in Razorpay
        try {
            await razorpay.subscriptions.cancel(subscription.subscriptionId);
        } catch (rzpError) {
            console.error('Razorpay Cancellation Error:', rzpError);
            if (rzpError.error?.description?.includes('already cancelled')) {
                // proceed
            } else {
                return res.status(500).json({ message: 'Payment gateway error' });
            }
        }

        // 2. Update DB
        subscription.status = 'cancelled';
        await subscription.save();

        // 3. Notify Admin
        notificationService.notifySubscriptionCancelledAdmin(subscription).catch(err => 
            console.error('Error sending cancellation notification to admin:', err)
        );

        res.json({ message: 'Subscription cancelled successfully', subscription });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get all subscriptions where the logged-in user is the motivator
 */
exports.getMotivatorReferrals = async (req, res) => {
    try {
        const motivatorId = req.user._id;
        const { status, page = 1, limit = 10, exportAll } = req.query;
        
        let query = { 
            $or: [
                { level1UserId: motivatorId },
                { level2UserId: motivatorId }
            ]
        };
        
        if (status === 'active') {
            query.status = 'active';
        } else if (status === 'inactive') {
            query.status = { $in: ['cancelled', 'created'] };
        }

        if (exportAll === 'true') {
            const allSubscriptions = await Subscription.find(query)
                .populate('donorUserId', 'name mobile email referralCode pan aadhaar')
                .sort({ createdAt: -1 });
            return res.json(allSubscriptions);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalRecords = await Subscription.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        const subscriptions = await Subscription.find(query)
            .populate('donorUserId', 'name mobile email referralCode pan aadhaar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            subscriptions,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching motivator referrals:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get all unique subscription amounts
 * @route   GET /api/subscriptions/admin/amounts
 * @access  Private/Admin
 */
exports.getUniqueAmounts = async (req, res) => {
    try {
        const amounts = await Subscription.distinct('amount');
        res.json(amounts.sort((a, b) => a - b));
    } catch (error) {
        console.error('Error fetching unique amounts:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
