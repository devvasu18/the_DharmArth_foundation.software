const mongoose = require('mongoose');

const bodyTestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    name_hi: {
        type: String,
        trim: true
    },
    price: {
        type: String,
        required: true,
        trim: true // e.g., "1999" or "₹1999"
    },
    originalPrice: {
        type: String,
        trim: true // e.g., "2499" or "₹2499" (optional original price before discount)
    },
    time: {
        type: String,
        required: true,
        trim: true // e.g., "45 mins"
    },
    category: {
        type: String,
        required: true,
        trim: true // e.g., "General Health", "Pathology", "Radiology"
    },
    category_hi: {
        type: String,
        trim: true // e.g., "सामान्य स्वास्थ्य", "पैथोलॉजी"
    },
    image: {
        type: String,
        default: '' // URL or path to uploaded image
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    description_hi: {
        type: String,
        default: '',
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
bodyTestSchema.pre('save', async function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('BodyTest', bodyTestSchema);
