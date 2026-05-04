const express = require('express');
const router = express.Router();
const CMSComponent = require('../models/CMSComponent');
const Page = require('../models/Page');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

// --- COMPONENT ROUTES ---

// @desc    Get all components
router.get('/components', protect, checkPermission('CMS Management', 'view'), async (req, res) => {
    try {
        const components = await CMSComponent.find().sort({ createdAt: -1 });
        res.json(components);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a component
router.post('/components', protect, checkPermission('CMS Management', 'edit'), async (req, res) => {
    try {
        const component = await CMSComponent.create(req.body);
        res.status(201).json(component);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update a component
router.put('/components/:id', protect, checkPermission('CMS Management', 'edit'), async (req, res) => {
    try {
        const component = await CMSComponent.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(component);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete a component
router.delete('/components/:id', protect, checkPermission('CMS Management', 'delete'), async (req, res) => {
    try {
        await CMSComponent.findByIdAndDelete(req.params.id);
        res.json({ message: 'Component deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- PAGE ROUTES ---

// @desc    Get all pages
router.get('/pages', protect, checkPermission('CMS Management', 'view'), async (req, res) => {
    try {
        const pages = await Page.find().sort({ createdAt: -1 });
        res.json(pages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get public page by slug
router.get('/pages/public/:slug', async (req, res) => {
    try {
        const page = await Page.findOne({ slug: req.params.slug, status: 'published' });
        
        if (!page) return res.status(404).json({ message: 'Page not found' });
        
        res.json({
            ...page._doc,
            components: page.components.sort((a, b) => a.order - b.order)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a page
router.post('/pages', protect, checkPermission('CMS Management', 'edit'), async (req, res) => {
    try {
        const page = await Page.create(req.body);
        res.status(201).json(page);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update a page
router.put('/pages/:id', protect, checkPermission('CMS Management', 'edit'), async (req, res) => {
    try {
        const page = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(page);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete a page
router.delete('/pages/:id', protect, checkPermission('CMS Management', 'delete'), async (req, res) => {
    try {
        await Page.findByIdAndDelete(req.params.id);
        res.json({ message: 'Page deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
