const DoctorCategory = require('../models/DoctorCategory');
const Doctor = require('../models/Doctor');

// Get all doctor categories
exports.getAllCategories = async (req, res) => {
    try {
        const { isActive } = req.query;
        const filter = {};

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const categories = await DoctorCategory.find(filter).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};

// Create a new doctor category
exports.createCategory = async (req, res) => {
    try {
        const { name, icon, isActive } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        // Check if category already exists
        const existing = await DoctorCategory.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
        if (existing) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = new DoctorCategory({
            name: name.trim(),
            icon: icon || '',
            isActive: isActive !== undefined ? isActive : true
        });

        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: 'Error creating category', error: error.message });
    }
};

// Update an existing category
exports.updateCategory = async (req, res) => {
    try {
        const { name, icon, isActive } = req.body;

        const category = await DoctorCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
            const existing = await DoctorCategory.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
            if (existing) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }
            category.name = name.trim();
        } else if (name) {
            category.name = name.trim();
        }

        if (icon !== undefined) category.icon = icon;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();
        res.json(category);
    } catch (error) {
        res.status(400).json({ message: 'Error updating category', error: error.message });
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await DoctorCategory.findByIdAndDelete(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Pull reference from any doctors that are linked to this category
        await Doctor.updateMany(
            { categories: categoryId },
            { $pull: { categories: categoryId } }
        );

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
};
