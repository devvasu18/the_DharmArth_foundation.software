const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'contacted', 'attended'],
        default: 'pending'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

// Prevent duplicate registration for the same mobile on the same event
eventRegistrationSchema.index({ event: 1, mobile: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
