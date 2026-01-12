const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    ctaText: { type: String, default: 'Donate' },
    ctaLink: { type: String, default: '/donate' }, // Internal route or external link
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Slider', sliderSchema);
