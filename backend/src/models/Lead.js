const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    mobile: {
        type: String,
        required: true,
        trim: true
    },
    language: {
        type: String, // 'en' or 'hi'
        default: 'en'
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'converted', 'closed'],
        default: 'new'
    },
    notes: {
        type: String
    },
    type: {
        type: String,
        enum: ['chat', 'donation_exit', 'contact'],
        default: 'chat'
    },
    source: {
        type: String
    },
    chatHistory: [{
        sender: String, // 'bot' or 'user'
        text: String,
        translationKey: String,
        timestamp: { type: Date, default: Date.now }
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: String,
    email: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
