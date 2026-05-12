const mongoose = require('mongoose');

const margSyncStatusSchema = new mongoose.Schema({
    lastSyncDatetime: {
        type: Date,
        default: null
    },
    lastIndex: {
        type: Number,
        default: 0
    },
    totalRecords: {
        type: Number,
        default: 0
    },
    syncStatus: {
        type: String,
        enum: ['Idle', 'In Progress', 'Completed', 'Failed'],
        default: 'Idle'
    },
    lastError: {
        type: String,
        default: null
    },
    lastSyncedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MargSyncStatus', margSyncStatusSchema);
