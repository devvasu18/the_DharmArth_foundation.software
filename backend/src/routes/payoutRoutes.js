const express = require('express');
const router = express.Router();
const PayoutRequest = require('../models/PayoutRequest');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const { protect, checkPermission } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');
const notificationService = require('../services/notificationService');
const whatsappService = require('../services/whatsappService');

// @desc    Send OTP for Payout Verification
// @route   POST /api/payouts/send-otp
router.post('/send-otp', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        let success = false;
        if (user.mobile === '9999999999' || user.mobile === '8888888888') {
            success = true;
            user.otp = '123456';
            user.otpExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await user.save();
        } else {
            success = await whatsappService.sendPayoutOTP(user.mobile, otp);
        }

        if (success) {
            res.json({ success: true, message: 'Verification OTP sent to your WhatsApp' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP via WhatsApp' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Request a Payout
// @route   POST /api/payouts/request
router.post('/request', protect, async (req, res) => {
    try {
        const { amount, otp } = req.body;
        const wallet = await Wallet.findOne({ user: req.user._id });
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isDemoUser = user.mobile === '9999999999' || user.mobile === '8888888888';
        if (!isDemoUser && (!user.otp || user.otp !== otp || user.otpExpires < new Date())) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        if (isDemoUser && otp !== '123456') {
            return res.status(400).json({ message: 'Invalid OTP. Please use the dummy OTP 123456.' });
        }

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        const withdrawAmount = parseFloat(amount) || wallet.balance;

        // Fetch Dynamic Settings (Only Min Balance)
        const minBalanceSetting = await Setting.findOne({ key: 'payout_min_balance' });
        const minBalance = minBalanceSetting ? Number(minBalanceSetting.value) : 500;

        if (withdrawAmount < minBalance) {
            return res.status(400).json({ message: `Minimum withdrawal amount is ₹${minBalance}` });
        }

        if (withdrawAmount > wallet.balance) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        if (!user.payoutCredentials || !user.payoutCredentials.accountNumber) {
            return res.status(400).json({ message: 'Please update your Payout Details (Bank) before requesting payout' });
        }

        // ATOMIC DEDUCTION: This prevents Target #6 (Race Conditions)
        const updatedWallet = await Wallet.findOneAndUpdate(
            { user: req.user._id, balance: { $gte: withdrawAmount } },
            { $inc: { balance: -withdrawAmount } },
            { new: true }
        );

        if (!updatedWallet) {
            return res.status(400).json({ message: 'Insufficient balance or concurrent transaction in progress. Please try again.' });
        }

        const payoutRequest = await PayoutRequest.create({
            user: req.user._id,
            amount: withdrawAmount,
            walletBalanceAtRequest: updatedWallet.balance + withdrawAmount, // original balance
            payoutDetails: user.payoutCredentials
        });

        // Log transaction as PENDING
        await Transaction.create({
            wallet: wallet._id,
            amount: withdrawAmount,
            type: 'debit',
            reason: 'payout',
            status: 'pending',
            referenceId: payoutRequest._id,
            description: `Payout Request #${payoutRequest._id.toString().slice(-6).toUpperCase()}`
        });

        // 4. Send Notification to Admins
        const notification = await notificationService.notifyPayoutRequested(payoutRequest, user);
        const io = req.app.get('io');
        if (io) {
            io.to('admin_notifications').emit('new_payout_request', notification);
        }

        // Clear OTP after successful request
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(201).json({ message: 'Payout request submitted successfully', request: payoutRequest });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get My Payout Requests
// @route   GET /api/payouts/my
router.get('/my', protect, async (req, res) => {
    try {
        const requests = await PayoutRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin: Get All Payout Requests
// @route   GET /api/payouts
router.get('/', protect, checkPermission('Transaction Management', 'view'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { status, search, isDisputed } = req.query;

        let query = {};
        
        if (isDisputed === 'true') {
            query.$or = [
                { isDisputed: true },
                { status: 'failed', userReply: { $exists: true, $ne: "" } }
            ];
        } else if (status && status !== 'all') {
            if (status === 'processed') {
                query.status = { $in: ['completed', 'failed'] };
            } else if (status === 'pending_all') {
                query.status = { $in: ['pending', 'exported'] };
            } else {
                query.status = status;
            }
        }

        if (search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { mobile: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);
            query.user = { $in: userIds };
        }

        const total = await PayoutRequest.countDocuments(query);
        const stats = await PayoutRequest.aggregate([
            { $match: query },
            { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
        ]);
        const totalAmount = stats.length > 0 ? stats[0].totalAmount : 0;

        const requests = await PayoutRequest.find(query)
            .populate('user', 'name mobile email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Global counts for dashboard tabs
        const allCounts = {
            pending: await PayoutRequest.countDocuments({ status: 'pending' }),
            exported: await PayoutRequest.countDocuments({ status: 'exported' }),
            processed: await PayoutRequest.countDocuments({ status: { $in: ['completed', 'failed'] } }),
            disputed: await PayoutRequest.countDocuments({ 
                $or: [
                    { isDisputed: true },
                    { status: 'failed', userReply: { $exists: true, $ne: "" } }
                ]
            })
        };

        res.json({
            payouts: requests,
            metadata: {
                total,
                totalAmount,
                page,
                pages: Math.ceil(total / limit),
                limit,
                allCounts
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin: Process Payout
// @route   PUT /api/payouts/:id
router.put('/:id', protect, checkPermission('Transaction Management', 'edit'), upload.single('image'), async (req, res) => {
    const { status, adminNotes, transactionId } = req.body;
    const proofImage = req.file ? req.file.path : req.body.proofImage;
    try {
        const request = await PayoutRequest.findById(req.params.id).populate('user', 'name mobile');
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Handle sync-only requests (for fixing stuck transaction statuses)
        if (req.body.syncOnly) {
            const currentStatus = request.status;
            const txnUpdateStatus = currentStatus === 'rejected' ? 'failed' : 'success';
            
            // 1. Aggressive search for matching transactions (by referenceId or description)
            let transactions = await Transaction.find({
                $or: [
                    { referenceId: request._id },
                    { description: new RegExp(request._id.toString().slice(-6), 'i') }
                ]
            });

            // 2. Secondary fallback: Search by User's Wallet + Amount + Reason (if still not found)
            if (transactions.length === 0) {
                const wallet = await Wallet.findOne({ user: request.user });
                if (wallet) {
                    transactions = await Transaction.find({
                        wallet: wallet._id,
                        amount: request.amount,
                        type: 'debit',
                        reason: 'payout',
                        status: 'pending' // Only look for the stuck one
                    });
                }
            }

            if (transactions.length > 0) {
                for (let txn of transactions) {
                    txn.status = txnUpdateStatus;
                    if (!txn.referenceId) txn.referenceId = request._id; // Link it for future
                    if (currentStatus === 'rejected') {
                        txn.description = `Payout Rejected (Request #${request._id.toString().slice(-6).toUpperCase()})`;
                    }
                    await txn.save();
                }
            }
            return res.json({ message: 'Transaction status synchronized', count: transactions.length });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        request.status = status;
        request.adminNotes = adminNotes;
        request.transactionId = transactionId;
        if (proofImage) request.proofImage = proofImage;
        request.processedAt = Date.now();
        await request.save();

        // Update transaction status
        const finalTxnStatus = status === 'rejected' ? 'failed' : 'success';
        const finalTxnDesc = status === 'rejected' ? `Payout Rejected (Request #${request._id.toString().slice(-6).toUpperCase()})` : null;

        const transactionsToUpdate = await Transaction.find({
            $or: [
                { referenceId: request._id },
                { description: new RegExp(request._id.toString().slice(-6), 'i') }
            ]
        });

        for (let txn of transactionsToUpdate) {
            txn.status = finalTxnStatus;
            if (finalTxnDesc) txn.description = finalTxnDesc;
            await txn.save();
        }

        // If REJECTED, refund the wallet ATOMICALLY
        if (status === 'rejected') {
            await Wallet.findOneAndUpdate(
                { user: request.user },
                { $inc: { balance: request.amount } }
            );

            // Log refund
            await Transaction.create({
                wallet: wallet._id,
                amount: request.amount,
                type: 'credit',
                reason: 'payout',
                status: 'success',
                description: `Payout Refund (Request #${request._id.toString().slice(-6).toUpperCase()})`
            });
        }

        // 4. Send Notification to User
        const userNotif = await notificationService.notifyPayoutProcessed(request, status);
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${request.user._id || request.user}`).emit('payout_processed', userNotif);
        }

        // 5. Send WhatsApp Notification on completion
        if (status === 'completed' && request.user && request.user.mobile) {
            await whatsappService.sendWithdrawalNotification(
                request.user.mobile,
                request.user.name,
                request.amount
            );
        }

        res.json({ message: `Payout request ${status}`, request });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    User: Report Issue / Dispute Payout
// @route   POST /api/payouts/dispute/:id
router.post('/dispute/:id', protect, async (req, res) => {
    try {
        const { message } = req.body;
        const payout = await PayoutRequest.findOne({ _id: req.params.id, user: req.user._id });

        if (!payout) {
            return res.status(404).json({ message: 'Payout request not found' });
        }

        if (payout.status !== 'completed') {
            return res.status(400).json({ message: 'Only completed payouts can be disputed' });
        }

        payout.isDisputed = true;
        payout.disputeMessage = message;
        payout.disputedAt = Date.now();
        await payout.save();

        // Notify Admin
        const io = req.app.get('io');
        const adminNotif = {
            type: 'PAYOUT_DISPUTE',
            message: `DISPUTE: ${req.user.name} reported issue with payout #${payout._id.toString().slice(-6).toUpperCase()}`,
            referenceId: payout._id,
            onModel: 'PayoutRequest'
        };

        if (io) {
            io.to('admin_notifications').emit('payout_disputed', adminNotif);
        }

        res.json({ message: 'Help request submitted to Admin', payout });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin: Resolve Dispute / Help Request
// @route   PUT /api/payouts/resolve-dispute/:id
router.put('/resolve-dispute/:id', protect, checkPermission('Transaction Management', 'edit'), async (req, res) => {
    try {
        const { notes } = req.body;
        const payout = await PayoutRequest.findById(req.params.id);

        if (!payout) {
            return res.status(404).json({ message: 'Payout request not found' });
        }

        payout.isHelpResolved = true;
        payout.helpResolutionNotes = notes;
        payout.helpResolvedAt = Date.now();
        await payout.save();

        // Notify User
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${payout.user}`).emit('payout_help_resolved', {
                message: `Your help request for payout #${payout._id.toString().slice(-6).toUpperCase()} has been resolved.`,
                notes: notes,
                payoutId: payout._id
            });
        }

        res.json({ message: 'Help request marked as resolved', payout });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin: Bulk Update Payout Status (e.g. mark as exported, completed, or failed)
// @route   PUT /api/payouts/bulk/status
router.put('/bulk/status', protect, checkPermission('Transaction Management', 'edit'), async (req, res) => {
    try {
        const { ids, status, adminNotes } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        const updateData = { status: status, processedAt: Date.now() };
        if (adminNotes) {
            updateData.adminNotes = adminNotes;
        }

        await PayoutRequest.updateMany(
            { _id: { $in: ids } },
            { $set: updateData }
        );

        // Update corresponding transactions
        const txnStatus = status === 'completed' ? 'success' : status === 'failed' ? 'failed' : 'pending';
        await Transaction.updateMany(
            { referenceId: { $in: ids } },
            { $set: { status: txnStatus } }
        );

        // If status is failed or completed, notify users (WhatsApp + Bell)
        if (status === 'failed' || status === 'completed') {
            const io = req.app.get('io');
            const requests = await PayoutRequest.find({ _id: { $in: ids } }).populate('user', 'name mobile');
            
            for (let request of requests) {
                // 1. In-App Bell Notification
                try {
                    const userNotif = await notificationService.notifyPayoutProcessed(request, status);
                    if (io) {
                        io.to(`user_${request.user._id}`).emit('payout_processed', userNotif);
                    }
                } catch (err) {
                    console.error("Failed to send in-app notification:", err.message);
                }

                // 2. WhatsApp Notification
                try {
                    if (request.user && request.user.mobile) {
                        if (status === 'completed') {
                            await whatsappService.sendWithdrawalNotification(request.user.mobile, request.user.name, request.amount);
                        } else if (status === 'failed') {
                            await whatsappService.sendWithdrawalFailedNotification(request.user.mobile, request.user.name, request.amount, adminNotes);
                        }
                    }
                } catch (err) {
                    console.error("Failed to send WhatsApp notification:", err.message);
                }
            }
        }

        res.json({ success: true, message: `Updated ${ids.length} payouts to ${status}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    User: Reply to Failed Payout
// @route   PUT /api/payouts/:id/reply
router.put('/:id/reply', protect, async (req, res) => {
    try {
        const { reply } = req.body;
        const payout = await PayoutRequest.findOne({ _id: req.params.id, user: req.user._id });

        if (!payout) {
            return res.status(404).json({ message: 'Payout request not found' });
        }

        if (payout.status !== 'failed') {
            return res.status(400).json({ message: 'Can only reply to failed payouts' });
        }

        if (payout.userReply) {
            return res.status(400).json({ message: 'You have already replied to this request' });
        }

        payout.userReply = reply;
        payout.userReplyAt = Date.now();
        // Reset status to exported or pending so admin can see it again? 
        // User said "user can rereply once", so maybe admin should see the reply and then take action.
        // Let's keep it as 'failed' but with a reply.
        await payout.save();

        // Notify Admin
        const io = req.app.get('io');
        if (io) {
            io.to('admin_notifications').emit('payout_user_reply', {
                message: `REPLY: ${req.user.name} replied to failed payout #${payout._id.toString().slice(-6).toUpperCase()}`,
                payoutId: payout._id,
                reply: reply
            });
        }

        res.json({ success: true, message: 'Reply sent successfully', payout });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin: Reset Failed Payout to Pending
// @route   PUT /api/payouts/:id/reset
router.put('/:id/reset', protect, checkPermission('Transaction Management', 'edit'), async (req, res) => {
    try {
        const payout = await PayoutRequest.findById(req.params.id).populate('user');
        if (!payout) return res.status(404).json({ message: 'Payout not found' });

        if (!payout.user || !payout.user.payoutCredentials) {
            return res.status(400).json({ message: "User bank details not found" });
        }

        // Update details from user's latest profile - explicit mapping ensures fresh data & encryption
        payout.status = 'pending';
        payout.payoutDetails = {
            bankName: payout.user.payoutCredentials.bankName || '',
            accountHolder: payout.user.payoutCredentials.accountHolder || '',
            accountNumber: payout.user.payoutCredentials.accountNumber || '',
            ifscCode: payout.user.payoutCredentials.ifscCode || ''
        };
        
        payout.adminNotes = undefined;
        payout.userReply = undefined;
        payout.userReplyAt = undefined;
        payout.processedAt = undefined;
        
        await payout.save();

        // Also update transaction status back to pending
        await Transaction.updateMany(
            { referenceId: payout._id },
            { $set: { status: 'pending' } }
        );

        res.json({ success: true, message: 'Payout reset to pending with latest bank details', payout });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin: Update Payout Details Manually
// @route   PUT /api/payouts/:id/details
router.put('/:id/details', protect, checkPermission('Transaction Management', 'edit'), async (req, res) => {
    try {
        const { bankName, accountNumber, ifscCode, accountHolder } = req.body;
        const payout = await PayoutRequest.findById(req.params.id);
        if (!payout) return res.status(404).json({ message: 'Payout not found' });

        payout.payoutDetails = {
            bankName,
            accountNumber,
            ifscCode,
            accountHolder: accountHolder || (payout.payoutDetails ? payout.payoutDetails.accountHolder : "")
        };
        
        // Also reset to pending automatically if admin is fixing it
        payout.status = 'pending';
        payout.adminNotes = undefined;
        payout.userReply = undefined;
        payout.processedAt = undefined;

        await payout.save();
        
        await Transaction.updateMany(
            { referenceId: payout._id },
            { $set: { status: 'pending' } }
        );

        res.json({ success: true, message: 'Payout details updated and reset to pending', payout });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
