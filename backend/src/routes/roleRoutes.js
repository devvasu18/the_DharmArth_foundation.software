const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

// @desc    Get All Roles
// @route   GET /api/roles
router.get('/', protect, checkPermission('Role Management', 'view'), async (req, res) => {
    try {
        const roles = await Role.find({});
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Permission Library
// @route   GET /api/roles/permissions
router.get('/permissions', protect, async (req, res) => {
    try {
        const permissions = await Permission.find({});
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create New Role
// @route   POST /api/roles
router.post('/', protect, checkPermission('Role Management', 'create'), async (req, res) => {
    const { name, permissions } = req.body; // permissions: [{ module: 'User Management', actions: ['view', 'create'] }]

    try {
        const roleExists = await Role.findOne({ name });
        if (roleExists) {
            return res.status(400).json({ message: 'Role already exists' });
        }

        const role = await Role.create({
            name,
            permissions, // formatted array of objects
            createdBy: req.user._id
        });

        res.status(201).json(role);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
