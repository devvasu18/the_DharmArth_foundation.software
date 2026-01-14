const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middlewares/authMiddleware');
const Event = require('../models/Event');

// Public Routes
router.get('/', async (req, res) => {
    try {
        const { status, limit, page = 1 } = req.query;
        let query = { isPublished: true };
        if (status) query.status = status;

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

module.exports = router;
