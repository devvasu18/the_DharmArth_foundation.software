const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middlewares/authMiddleware');
const Event = require('../models/Event');

// Public Routes
router.get('/', async (req, res) => {
    try {
        const { status, category, limit, page = 1 } = req.query;
        let query = { isPublished: true };
        if (status) query.status = status;
        if (category) query.category = category;

        const limitVal = parseInt(limit) || 10;
        const skipObs = (parseInt(page) - 1) * limitVal;

        const events = await Event.find(query)
            .sort({ date: 1 })
            .limit(limitVal)
            .skip(skipObs);

        const total = await Event.countDocuments(query);

        res.json({ events, total, pages: Math.ceil(total / limitVal) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/slug/:slug', async (req, res) => {
    try {
        const event = await Event.findOne({ slug: req.params.slug, isPublished: true });
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Event Registration / Interest
router.post('/register', async (req, res) => {
    try {
        const { eventId, name, mobile, email, userId } = req.body;

        if (!eventId || !name || !mobile) {
            return res.status(400).json({ message: 'Event ID, name and mobile are required' });
        }

        const EventRegistration = require('../models/EventRegistration');

        // Check if already registered
        const existing = await EventRegistration.findOne({ event: eventId, mobile });
        if (existing) {
            return res.status(400).json({ message: 'You have already registered for this event with this mobile number.' });
        }

        const registration = new EventRegistration({
            event: eventId,
            user: userId || null,
            name,
            mobile,
            email,
            status: 'pending'
        });

        await registration.save();
        res.status(201).json({ message: 'Interest registered successfully. We will contact you soon!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// Admin Routes
// Get all events for admin (drafts included)
router.get('/admin/all', protect, checkPermission('Events', 'view'), async (req, res) => {
    try {
        const events = await Event.find({}).sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/admin/:id', protect, checkPermission('Events', 'view'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', protect, checkPermission('Events', 'create'), async (req, res) => {
    try {
        const { title, slug } = req.body;

        let initialSlug = slug;
        if (!initialSlug && title) {
            initialSlug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }

        // Check uniqueness of slug
        const existingEvent = await Event.findOne({ slug: initialSlug });
        if (existingEvent) {
            return res.status(400).json({ message: 'Slug already exists. Please choose another.' });
        }

        req.body.slug = initialSlug;
        req.body.createdBy = req.user._id;

        const event = new Event(req.body);
        const savedEvent = await event.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/:id', protect, checkPermission('Events', 'edit'), async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', protect, checkPermission('Events', 'delete'), async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send Notifications for Event
router.post('/:id/notify', protect, checkPermission('Events', 'edit'), async (req, res) => {
    try {
        const { targetType, userIds, channels } = req.body;
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const User = require('../models/User');
        const EventNotificationLog = require('../models/EventNotificationLog');
        const whatsappService = require('../services/whatsappService');
        const Notification = require('../models/Notification');

        let users = [];
        if (targetType === 'all') {
            users = await User.find({ isSuperAdmin: false, roles: { $size: 0 }, isSuspended: false });
        } else if (targetType === 'selected') {
            users = await User.find({ _id: { $in: userIds } });
        }

        if (users.length === 0) {
            return res.status(400).json({ message: 'No users found for the selected criteria' });
        }

        const log = new EventNotificationLog({
            event: event._id,
            admin: req.user._id,
            targetType,
            channels,
            totalUsers: users.length,
            status: 'queued'
        });
        await log.save();

        // Non-blocking processing
        const processNotifications = async (targetUsers, eventData, selectedChannels, logId) => {
            let sent = 0;
            let failed = 0;

            for (const user of targetUsers) {
                try {
                    let userSent = false;
                    if (selectedChannels.includes('whatsapp') && user.mobile) {
                        await whatsappService.sendEventNotification(user.mobile, user.name, eventData);
                        userSent = true;
                    }
                    if (selectedChannels.includes('app')) {
                        await Notification.create({
                            type: 'EVENT',
                            user: user._id,
                            message: `New Event: ${eventData.title}. Check it out!`,
                            referenceId: eventData._id,
                            onModel: 'Event'
                        });
                        userSent = true;
                    }
                    if (userSent) sent++;
                } catch (err) {
                    console.error(`Error notifying user ${user._id}:`, err);
                    failed++;
                }
            }

            await EventNotificationLog.findByIdAndUpdate(logId, {
                sentUsersCount: sent,
                failedUsersCount: failed,
                status: failed === 0 ? 'completed' : (sent === 0 ? 'failed' : 'partially_completed')
            });
        };

        processNotifications(users, event, channels, log._id).catch(err => console.error("Notification Processing Error:", err));

        res.json({ message: `Notifications queued for ${users.length} users`, logId: log._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
