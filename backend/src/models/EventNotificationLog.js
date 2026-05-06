const mongoose = require('mongoose');

const eventNotificationLogSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetType: {
        type: String,
        enum: ['all', 'selected'],
        required: true
    },
    channels: [{
        type: String,
        enum: ['whatsapp', 'app']
    }],
    totalUsers: {
        type: Number,
        default: 0
    },
    sentUsersCount: {
        type: Number,
        default: 0
    },
    failedUsersCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['queued', 'completed', 'partially_completed', 'failed'],
        default: 'queued'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EventNotificationLog', eventNotificationLogSchema);
