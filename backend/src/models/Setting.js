const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., 'site_title', 'show_save_life_banner'
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be string, boolean, or object
    description: { type: String },
    group: { type: String, default: 'general' } // 'general', 'feature_flags', 'styles'
}, {
    timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
