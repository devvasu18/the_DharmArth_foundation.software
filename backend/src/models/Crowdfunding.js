const mongoose = require('mongoose');

const crowdfundingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    title_hi: { type: String },
    text: { type: String, required: true },
    text_hi: { type: String },
    imageUrl: { type: String },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    type: { type: String, default: 'section' } // For future proofing
}, { timestamps: true });

module.exports = mongoose.model('Crowdfunding', crowdfundingSchema);
