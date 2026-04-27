const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['image', 'video', 'text', 'youtube', 'instagram'],
        required: true
    },
    // Using Mixed for flexibility as each block has different data
    // Image: { url, caption, date, location, layout (gallery/slider) }
    // Video: { url, thumbnail, caption }
    // Text: { content (html) }
    // YouTube: { url, thumbnail, title, description, layout }
    // Instagram: { url, layout }
    content: { type: mongoose.Schema.Types.Mixed },
    id: { type: String } // Unique ID for frontend drag-drop tracking
}, { _id: false });

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    title_hi: { type: String },
    slug: { type: String, unique: true, required: true },
    coverImage: { type: String }, // URL
    heroImages: [{ type: String }], // Array of URLs for hero slider
    date: { type: Date },
    location: { type: String },
    location_hi: { type: String },
    shortDescription: { type: String },
    shortDescription_hi: { type: String },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed'],
        default: 'upcoming'
    },
    category: {
        type: String,
        enum: ['Health Blog', 'Medical Camp', 'Social Event', 'Success Story'],
        default: 'Social Event'
    },
    blocks: [contentBlockSchema],
    metaTitle: { type: String },
    metaDescription: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
