const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true,
        trim: true
    },
    order: {
        type: Number,
        default: 0
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    question_hi: {
        type: String,
        trim: true
    },
    answer_hi: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('FAQ', faqSchema);
