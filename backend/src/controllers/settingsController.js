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
            gstPercent: 12,
            dayTimeContactText: "Pharmacist will contact you in 10-20 minutes",
            nightTimeContactText: "Foundation will contact you at 8:30 AM",
            faqs: [],
            acceptedPincodes: ''
        };
    }
    // Ensure new fields have defaults if they don't exist in saved config
    const mergedConfig = {
        dayTimeContactText: "Pharmacist will contact you in 10-20 minutes",
        nightTimeContactText: "Foundation will contact you at 8:30 AM",
        faqs: [],
        acceptedPincodes: '',
        ...config.value
    };
    return mergedConfig;
};

// @desc    Get public pharmacy settings
// @route   GET /api/settings/pharmacy/public
// @access  Public
const getPublicPharmacySettings = async (req, res) => {
    try {
        const config = await getPharmacyConfig();
        // Only return necessary public info if needed, but for now return all config
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Helper to get app version config
const getAppVersionConfig = async () => {
    const config = await Settings.findOne({ key: 'app_config' });
    if (!config) {
        // Return defaults
        return {
            latestVersion: "1.0.0",
            latestVersionCode: 1,
            latestVersionCodeIos: 1,
            forceUpdate: false,
            playStoreUrl: "https://play.google.com/store/apps/details?id=com.thedharmarth.foundation",
            appStoreUrl: "https://apps.apple.com/app/id6780563745"
        };
    }
    // Ensure all fields have defaults if they don't exist
    return {
        latestVersion: "1.0.0",
        latestVersionCode: 1,
        latestVersionCodeIos: 1,
        forceUpdate: false,
        playStoreUrl: "https://play.google.com/store/apps/details?id=com.thedharmarth.foundation",
        appStoreUrl: "https://apps.apple.com/app/id6780563745",
        ...config.value
    };
};

// @desc    Get public app version settings
// @route   GET /api/settings/app-version/public
// @access  Public
const getPublicAppVersionSettings = async (req, res) => {
    try {
        const config = await getAppVersionConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getPharmacyConfig,
    getPublicPharmacySettings,
    getPublicAppVersionSettings
};

