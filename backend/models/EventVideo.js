const mongoose = require('mongoose');

const eventVideoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    videoUrl: {
        type: String,
        required: true
    },
    videoId: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('EventVideo', eventVideoSchema);
