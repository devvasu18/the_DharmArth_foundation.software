const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');

// Get all galleries (public)
router.get('/', async (req, res) => {
    try {
        const galleries = await Gallery.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(galleries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Get all (including inactive)
router.get('/admin', async (req, res) => {
    try {
        const galleries = await Gallery.find().sort({ order: 1, createdAt: -1 });
        res.json(galleries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create
router.post('/', async (req, res) => {
    const gallery = new Gallery(req.body);
    try {
        const newGallery = await gallery.save();
        res.status(201).json(newGallery);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update
router.put('/:id', async (req, res) => {
    try {
        const gallery = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(gallery);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete
router.delete('/:id', async (req, res) => {
    try {
        await Gallery.findByIdAndDelete(req.params.id);
        res.json({ message: 'Gallery deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Single by ID
router.get('/:id', async (req, res) => {
    try {
        const gallery = await Gallery.findById(req.params.id);
        if (!gallery) return res.status(404).json({ message: 'Gallery not found' });
        res.json(gallery);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
