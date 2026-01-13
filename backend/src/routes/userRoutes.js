const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, checkPermission('User Management', 'view'), async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .populate('roles')
            .populate('referredBy', 'name mobile'); // Populate referrer info

        // Fetch all wallets
        const wallets = await Wallet.find({});
        const walletMap = {};
        wallets.forEach(w => {
            if (w.user) walletMap[w.user.toString()] = w.balance;
        });

        const usersWithWallet = users.map(user => ({
            ...user.toObject(),
            walletBalance: walletMap[user._id.toString()] || 0
        }));

        res.json(usersWithWallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign Role to User
// @route   POST /api/users/assign-role
// @access  Private/Admin
router.post('/assign-role', protect, checkPermission('Role Management', 'edit'), async (req, res) => {
    const { userId, roleIds } = req.body; // roleIds is array of Role IDs
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.roles = roleIds;
        await user.save();

        res.json({ message: 'Roles updated', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update User Language
// @route   PUT /api/users/language
// @access  Private
router.put('/language', protect, async (req, res) => {
    const { language } = req.body;
    console.log("Updating language for user:", req.user?._id, "to", language);
    if (!['en', 'hi'].includes(language)) {
        console.log("Invalid language:", language);
        return res.status(400).json({ message: 'Invalid language' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.language = language;
            await user.save();
            res.json({ message: 'Language updated', language: user.language });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Language Update Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
