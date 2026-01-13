const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

// @desc    Get all normal users (non-staff)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, checkPermission('User Management', 'view'), async (req, res) => {
    try {
        // Filter: Not Super Admin AND No Roles
        const users = await User.find({
            isSuperAdmin: false,
            roles: { $size: 0 }
        })
            .select('-password')
            .populate('roles')
            .populate('referredBy', 'name mobile'); // Populate referrer info

        // Fetch all wallets (optimization: could filter wallets by userIds found above)
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

// @desc    Get all staff members (users with roles or superadmin)
// @route   GET /api/users/staff
// @access  Private/SuperAdmin
router.get('/staff', protect, async (req, res) => {
    // Restrict to Super Admin or Users with Role Management view permission
    if (!req.user.isSuperAdmin) {
        // Check manually if middleware not used
        const hasPerm = req.user.roles && req.user.roles.some(r =>
            r.permissions && r.permissions.some(p => p.module === 'Role Management' && p.actions.includes('view'))
        );
        if (!hasPerm) {
            return res.status(403).json({ message: 'Access denied' });
        }
    }

    try {
        const staff = await User.find({
            $or: [
                { isSuperAdmin: true },
                { roles: { $not: { $size: 0 } } }
            ]
        })
            .select('-password')
            .populate('roles');

        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin (with View User permission)
router.get('/:id', protect, checkPermission('User Management', 'view'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('roles')
            .populate('referredBy', 'name mobile');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const wallet = await Wallet.findOne({ user: user._id });
        const userWithWallet = {
            ...user.toObject(),
            walletBalance: wallet ? wallet.balance : 0
        };

        res.json(userWithWallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Suspend/Unsuspend User
// @route   PUT /api/users/:id/suspend
// @access  Private/Admin (Edit User permission)
router.put('/:id/suspend', protect, checkPermission('User Management', 'edit'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isSuperAdmin) {
            return res.status(400).json({ message: 'Cannot suspend Super Admin' });
        }

        user.isSuspended = !user.isSuspended;
        await user.save();

        res.json({
            message: `User ${user.isSuspended ? 'suspended' : 'activated'}`,
            isSuspended: user.isSuspended
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create Staff Member
// @route   POST /api/users/staff
// @access  Private/SuperAdmin
router.post('/staff', protect, async (req, res) => {
    if (!req.user.isSuperAdmin) {
        return res.status(403).json({ message: 'Only Super Admin can create staff' });
    }

    const { name, mobile, email, password, roleId } = req.body;

    try {
        const checkQuery = { $or: [{ mobile }] };
        if (email && email.trim() !== '') {
            checkQuery.$or.push({ email });
        }

        const userExists = await User.findOne(checkQuery);
        if (userExists) {
            return res.status(400).json({ message: 'User with this mobile or email already exists' });
        }

        const user = await User.create({
            name,
            mobile,
            email: email || undefined,
            password,
            roles: [roleId]
        });

        // Create Wallet for staff? Maybe not needed but good for consistency
        await Wallet.create({ user: user._id });

        res.status(201).json({ message: 'Staff created successfully', user });
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
