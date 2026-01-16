const mongoose = require('mongoose');

const eventHeaderSchema = new mongoose.Schema({
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    url: { type: String, required: true }, // Image or Video URL
    title: { type: String },
    title_hi: { type: String }, // Hindi
    subtitle: { type: String },
    subtitle_hi: { type: String }, // Hindi
    description: { type: String },
    description_hi: { type: String }, // Hindi
    ctaText: { type: String, default: 'Learn More' },
    ctaText_hi: { type: String }, // Hindi
    ctaLink: { type: String },
    titleColor: { type: String, default: '#ffffff' },
    descriptionColor: { type: String, default: '#ffffff' },
    textPosition: {
        type: String,
        enum: ['center', 'left', 'right', 'top-left', 'top-right'],
        default: 'center'
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('EventHeader', eventHeaderSchema);
