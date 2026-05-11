const express = require('express');
const router = express.Router();
const Slider = require('../models/Slider');
const Crowdfunding = require('../models/Crowdfunding');
const FAQ = require('../models/FAQ');
const Setting = require('../models/Setting');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

// --- SLIDERS ---

// Get all public sliders
router.get('/sliders', async (req, res) => {
    try {
        const sliders = await Slider.find({ isVisible: true }).sort('order');
        res.json(sliders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: CRUD Sliders
router.post('/sliders', protect, checkPermission('Content Management', 'create'), async (req, res) => {
    try {
        const slider = await Slider.create(req.body);
        res.status(201).json(slider);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Update Slider
router.put('/sliders/:id', protect, checkPermission('Content Management', 'edit'), async (req, res) => {
    try {
        const slider = await Slider.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!slider) return res.status(404).json({ message: 'Slider not found' });
        res.json(slider);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Delete Slider
router.delete('/sliders/:id', protect, checkPermission('Content Management', 'delete'), async (req, res) => {
    try {
        const slider = await Slider.findByIdAndDelete(req.params.id);
        if (!slider) return res.status(404).json({ message: 'Slider not found' });
        res.json({ message: 'Slider deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- CROWDFUNDING ---

// Get all public crowdfunding sections
router.get('/crowdfunding', async (req, res) => {
    try {
        const sections = await Crowdfunding.find({ isVisible: true }).sort('order');
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: CRUD Crowdfunding
router.post('/crowdfunding', protect, checkPermission('Content Management', 'create'), async (req, res) => {
    try {
        const section = await Crowdfunding.create(req.body);
        res.status(201).json(section);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Update Crowdfunding
router.put('/crowdfunding/:id', protect, checkPermission('Content Management', 'edit'), async (req, res) => {
    try {
        const section = await Crowdfunding.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!section) return res.status(404).json({ message: 'Section not found' });
        res.json(section);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Delete Crowdfunding
router.delete('/crowdfunding/:id', protect, checkPermission('Content Management', 'delete'), async (req, res) => {
    try {
        const section = await Crowdfunding.findByIdAndDelete(req.params.id);
        if (!section) return res.status(404).json({ message: 'Section not found' });
        res.json({ message: 'Section deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- FAQS ---

// Get all public FAQs
router.get('/faqs', async (req, res) => {
    try {
        const faqs = await FAQ.find({ isVisible: true }).sort('order');
        res.json(faqs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: CRUD FAQs
router.post('/faqs', protect, checkPermission('Content Management', 'create'), async (req, res) => {
    try {
        const faq = await FAQ.create(req.body);
        res.status(201).json(faq);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Update FAQ
router.put('/faqs/:id', protect, checkPermission('Content Management', 'edit'), async (req, res) => {
    try {
        const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!faq) return res.status(404).json({ message: 'FAQ not found' });
        res.json(faq);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Delete FAQ
router.delete('/faqs/:id', protect, checkPermission('Content Management', 'delete'), async (req, res) => {
    try {
        const faq = await FAQ.findByIdAndDelete(req.params.id);
        if (!faq) return res.status(404).json({ message: 'FAQ not found' });
        res.json({ message: 'FAQ deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- SETTINGS ---

// Get Public Settings (Filtered) or All?
// Usually frontend needs specific settings.
router.get('/settings', async (req, res) => {
    try {
        const settings = await Setting.find({});
        // Transform to key-value object for easier frontend usage
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Update Settings
router.put('/settings', protect, checkPermission('Settings', 'edit'), async (req, res) => {
    // Expects array of [{key: 'x', value: 'y'}] or single update?
    // Let's support bulk update for simplicity
    const updates = req.body; // { key: value, key2: value2 }

    try {
        const keys = Object.keys(updates);
        for (const key of keys) {
            await Setting.findOneAndUpdate(
                { key },
                { value: updates[key] },
                { upsert: true, new: true }
            );
        }
        res.json({ message: 'Settings updated' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
