const express = require('express');
const router = express.Router();
const EventVideo = require('../models/EventVideo');

// Get all videos (public & admin)
router.get('/', async (req, res) => {
    try {
        // Sort by order (asc) or createdAt (desc)
        const videos = await EventVideo.find().sort({ order: 1, createdAt: -1 });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new video
router.post('/', async (req, res) => {
    const { title, videoUrl, videoId, thumbnail, order, isActive } = req.body;

    const video = new EventVideo({
        title,
        videoUrl,
        videoId,
        thumbnail,
        order,
        isActive
    });

    try {
        const newVideo = await video.save();
        res.status(201).json(newVideo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update video
router.put('/:id', async (req, res) => {
    try {
        const video = await EventVideo.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        if (req.body.title != null) video.title = req.body.title;
        if (req.body.videoUrl != null) video.videoUrl = req.body.videoUrl;
        if (req.body.videoId != null) video.videoId = req.body.videoId;
        if (req.body.thumbnail != null) video.thumbnail = req.body.thumbnail;
        if (req.body.order != null) video.order = req.body.order;
        if (req.body.isActive != null) video.isActive = req.body.isActive;

        const updatedVideo = await video.save();
        res.json(updatedVideo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete video
router.delete('/:id', async (req, res) => {
    try {
        const video = await EventVideo.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        await video.deleteOne();
        res.json({ message: 'Video deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reorder videos (batch update)
router.post('/reorder', async (req, res) => {
    const { orderedIds } = req.body;
    try {
        const updates = orderedIds.map((id, index) => {
            return EventVideo.findByIdAndUpdate(id, { order: index });
        });
        await Promise.all(updates);
        res.json({ message: 'Videos reordered' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
