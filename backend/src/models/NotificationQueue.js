const mongoose = require('mongoose');

const notificationQueueSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['whatsapp', 'email'],
        required: true
    },
    recipient: {
        type: String,
        required: true
    },
    content: {
        type: mongoose.Schema.Types.Mixed, // Stores message for WhatsApp or {subject, text, html} for email
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'sent', 'failed'],
        default: 'pending',
        index: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    lastError: {
        type: String
    },
    scheduledAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed // For tracking donationId, motivatorId etc.
    }
}, {
    timestamps: true
});

// Index for the worker to quickly find pending tasks
notificationQueueSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('NotificationQueue', notificationQueueSchema);
