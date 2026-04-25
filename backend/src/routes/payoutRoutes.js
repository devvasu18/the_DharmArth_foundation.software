const express = require('express');
const router = express.Router();
const PayoutRequest = require('../models/PayoutRequest');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect, checkPermission } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');
const notificationService = require('../services/notificationService');
const whatsappService = require('../services/whatsappService');

// @desc    Request a Payout
// @route   POST /api/payouts/request
router.post('/request', protect, async (req, res) => {
    try {
        const { amount } = req.body;
        const wallet = await Wallet.findOne({ user: req.user._id });
        const user = await User.findById(req.user._id);

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        const withdrawAmount = parseFloat(amount) || wallet.balance;

        if (withdrawAmount < 500) {
            return res.status(400).json({ message: 'Minimum withdrawal amount is ₹500' });
        }

        if (withdrawAmount > wallet.balance) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Check for lock-in (90 days)
        const lockInDate = new Date(wallet.createdAt || user.createdAt);
        lockInDate.setDate(lockInDate.getDate() + 90);
        if (new Date() < lockInDate) {
            return res.status(400).json({ message: 'Withdrawal locked for 90 days from joining' });
        }

        // Check if pending request exists
        const existingRequest = await PayoutRequest.findOne({ user: req.user._id, status: 'pending' });
        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending payout request' });
        }

        if (!user.payoutCredentials || (!user.payoutCredentials.accountNumber && !user.payoutCredentials.upiId)) {
            return res.status(400).json({ message: 'Please update your Payout Details (Bank or UPI) before requesting payout' });
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
            query.isDisputed = true;
        } else if (status && status !== 'all') {
            if (status === 'processed') {
                query.status = { $in: ['completed', 'rejected'] };
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
        const requests = await PayoutRequest.find(query)
            .populate('user', 'name mobile email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            payouts: requests,
            metadata: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
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

module.exports = router;
