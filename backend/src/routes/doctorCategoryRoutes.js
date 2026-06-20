const express = require('express');
const router = express.Router();
const doctorCategoryController = require('../controllers/doctorCategoryController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', doctorCategoryController.getAllCategories);

// Admin routes (Protected)
router.post('/', protect, adminOnly, doctorCategoryController.createCategory);
router.put('/:id', protect, adminOnly, doctorCategoryController.updateCategory);
router.delete('/:id', protect, adminOnly, doctorCategoryController.deleteCategory);

module.exports = router;
