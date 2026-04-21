const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

const { protect } = require('../middlewares/authMiddleware');

// @desc Get recent notifications
// @route GET /api/notifications
router.get('/', protect, async (req, res) => {
    try {
        const isAdmin = req.user.isSuperAdmin || (req.user.roles && req.user.roles.length > 0);
        const query = isAdmin ? { user: null } : { user: req.user._id };

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Mark all as read
// @route PUT /api/notifications/read-all
router.put('/read-all', protect, async (req, res) => {
    try {
        const isAdmin = req.user.isSuperAdmin || (req.user.roles && req.user.roles.length > 0);
        const query = isAdmin ? { user: null } : { user: req.user._id };

        await Notification.updateMany({ ...query, isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
