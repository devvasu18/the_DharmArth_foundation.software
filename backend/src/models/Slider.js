const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
    type: { type: String, enum: ['image', 'text'], default: 'image' }, // Separates concerns
    title: { type: String }, // Required only for type='text' logically
    title_hi: { type: String }, // Hindi Title
    subtitle: { type: String },
    subtitle_hi: { type: String }, // Hindi Subtitle
    imageUrl: { type: String }, // Required only for type='image' logically
    ctaText: { type: String, default: 'Donate' },
    ctaText_hi: { type: String }, // Hindi CTA Text
    ctaLink: { type: String, default: '/donate' }, // Internal route or external link
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Slider', sliderSchema);
