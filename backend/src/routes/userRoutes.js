const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, checkPermission('User Management', 'view'), async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .populate('roles'); // Populate roles if needed
        res.json(users);
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

module.exports = router;
