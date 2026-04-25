const Subscription = require('../models/Subscription');
const razorpay = require('../config/razorpay');

/**
 * @desc    Get current user's subscriptions
 * @route   GET /api/subscriptions/my
 * @access  Private
 */
exports.getMySubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({
            $or: [
                { donorUserId: req.user._id },
                { donorMobile: req.user.mobile }
            ]
        }).sort({ createdAt: -1 });

        res.json(subscriptions);
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
        const { status, search } = req.query;
        let query = {};

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { donorName: { $regex: search, $options: 'i' } },
                { donorMobile: { $regex: search, $options: 'i' } },
                { subscriptionId: { $regex: search, $options: 'i' } }
            ];
        }

        const subscriptions = await Subscription.find(query)
            .populate('level1UserId', 'name mobile')
            .sort({ createdAt: -1 });

        res.json(subscriptions);
    } catch (error) {
        console.error('Error fetching all subscriptions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Cancel a subscription
 * @route   POST /api/subscriptions/cancel/:id
 * @access  Private (Owner or Admin)
 */
exports.cancelSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        // Authorization check: Only owner or admin
        const isOwner = subscription.donorUserId?.toString() === req.user._id.toString() || 
                        subscription.donorMobile === req.user.mobile;
        
        if (!isOwner && !req.user.isSuperAdmin && !req.user.roles?.some(r => r.name === 'Admin')) {
            return res.status(403).json({ message: 'Not authorized to cancel this subscription' });
        }

        if (subscription.status === 'cancelled') {
            return res.status(400).json({ message: 'Subscription is already cancelled' });
        }

        // 1. Cancel in Razorpay
        try {
            await razorpay.subscriptions.cancel(subscription.subscriptionId);
        } catch (rzpError) {
            console.error('Razorpay Cancellation Error:', rzpError);
            // If Razorpay says it's already cancelled or not found, we still update our DB
            if (rzpError.error?.description?.includes('already cancelled')) {
                // proceed
            } else {
                return res.status(500).json({ message: 'Failed to cancel subscription on payment gateway' });
            }
        }

        // 2. Update DB
        subscription.status = 'cancelled';
        await subscription.save();

        res.json({ message: 'Subscription cancelled successfully', subscription });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
