const Settings = require('../models/Settings');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
    try {
        const settings = await Settings.find();
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update settings
// @route   PATCH /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
    try {
        const updates = req.body; // e.g. { pharmacy_config: { ... } }
        
        for (const [key, value] of Object.entries(updates)) {
            await Settings.findOneAndUpdate(
                { key },
                { value, updatedBy: req.user._id },
                { upsert: true, new: true }
            );
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper to get specific config
const getPharmacyConfig = async () => {
    const config = await Settings.findOne({ key: 'pharmacy_config' });
    if (!config) {
        // Return defaults
        return {
            platformFeePercent: 2,
            deliveryChargeType: 'flat',
            flatDeliveryCharge: 50,
            percentDeliveryThreshold: 500,
            percentDeliveryBelowThreshold: 10,
            percentDeliveryAboveThreshold: 5,
            gstPercent: 12
        };
    }
    return config.value;
};

module.exports = {
    getSettings,
    updateSettings,
    getPharmacyConfig
};
