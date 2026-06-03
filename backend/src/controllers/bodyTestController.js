const BodyTest = require('../models/BodyTest');

// Get all body tests
exports.getAllBodyTests = async (req, res) => {
    try {
        const { category, isActive } = req.query;
        const filter = {};

        if (category) filter.category = category;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const tests = await BodyTest.find(filter).sort({ createdAt: -1 });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching body tests', error: error.message });
    }
};

// Get single body test
exports.getBodyTestById = async (req, res) => {
    try {
        const test = await BodyTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Body test not found' });
        }
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching body test', error: error.message });
    }
};

// Create body test
exports.createBodyTest = async (req, res) => {
    try {
        const test = new BodyTest(req.body);
        await test.save();
        res.status(201).json(test);
    } catch (error) {
        res.status(400).json({ message: 'Error saving body test', error: error.message });
    }
};

// Update body test
exports.updateBodyTest = async (req, res) => {
    try {
        const test = await BodyTest.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!test) {
            return res.status(404).json({ message: 'Body test not found' });
        }
        res.json(test);
    } catch (error) {
        res.status(400).json({ message: 'Error updating body test', error: error.message });
    }
};

// Delete body test
exports.deleteBodyTest = async (req, res) => {
    try {
        const test = await BodyTest.findByIdAndDelete(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Body test not found' });
        }
        res.json({ message: 'Body test deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting body test', error: error.message });
    }
};
