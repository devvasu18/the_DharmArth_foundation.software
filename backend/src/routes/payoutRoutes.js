const express = require('express');
const router = express.Router();
const PayoutRequest = require('../models/PayoutRequest');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

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

        const payoutRequest = await PayoutRequest.create({
            user: req.user._id,
            amount: withdrawAmount,
            walletBalanceAtRequest: wallet.balance,
            payoutDetails: user.payoutCredentials
        });

        // Deduct only the requested amount
        wallet.balance -= withdrawAmount;
        await wallet.save();

        // Log transaction
        await Transaction.create({
            wallet: wallet._id,
            amount: withdrawAmount,
            type: 'debit',
            reason: 'payout',
            status: 'pending',
            description: `Payout Request #${payoutRequest._id.toString().slice(-6)}`
        });

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
        const requests = await PayoutRequest.find().populate('user', 'name mobile email').sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin: Process Payout
// @route   PUT /api/payouts/:id
router.put('/:id', protect, checkPermission('Transaction Management', 'edit'), async (req, res) => {
    const { status, adminNotes, transactionId } = req.body;
    try {
        const request = await PayoutRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        request.status = status;
        request.adminNotes = adminNotes;
        request.transactionId = transactionId;
        request.processedAt = Date.now();
        await request.save();

        // If REJECTED, refund the wallet
        if (status === 'rejected') {
            const wallet = await Wallet.findOne({ user: request.user });
            wallet.balance += request.amount;
            await wallet.save();

            // Log refund
            await Transaction.create({
                wallet: wallet._id,
                amount: request.amount,
                type: 'credit',
                reason: 'payout',
                status: 'success',
                description: `Payout Refund (Request #${request._id.toString().slice(-6)})`
            });
        } else if (status === 'completed' || status === 'approved') {
            // Update transaction status
            await Transaction.findOneAndUpdate(
                { description: new RegExp(request._id.toString().slice(-6)) },
                { status: 'success' }
            );
        }

        res.json({ message: `Payout request ${status}`, request });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
