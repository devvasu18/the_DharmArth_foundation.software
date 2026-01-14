const express = require('express');
const router = express.Router();
const EventHeader = require('../models/EventHeader');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

// Get all active sliders for public
router.get('/', async (req, res) => {
    try {
        const headers = await EventHeader.find({ isActive: true }).sort({ order: 1 });
        res.json(headers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Get all (active & inactive)
router.get('/admin', protect, async (req, res) => {
    try {
        const headers = await EventHeader.find({}).sort({ order: 1 });
        res.json(headers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Create
router.post('/', protect, async (req, res) => {
    try {
        const newHeader = new EventHeader(req.body);
        const savedHeader = await newHeader.save();
        res.status(201).json(savedHeader);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Update
router.put('/:id', protect, async (req, res) => {
    try {
        const updatedHeader = await EventHeader.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedHeader);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: Delete
router.delete('/:id', protect, async (req, res) => {
    try {
        await EventHeader.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
