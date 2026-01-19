const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true // e.g., "Cardiologist", "General Physician"
    },
    experience: {
        type: String,
        required: true // e.g., "12+ Years Experience"
    },
    expertiseBadge: {
        type: String,
        enum: ['Top Expert', 'Senior Specialist', 'Professional Doctor'],
        default: 'Professional Doctor'
    },
    type: {
        type: String,
        enum: ['government', 'clinic'],
        required: true
    },
    priority: {
        type: Number,
        default: 0 // Higher for clinic doctors
    },
    photo: {
        type: String,
        default: '' // URL to doctor's photo
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmergencyAvailable: {
        type: Boolean,
        default: false
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
doctorSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Doctor', doctorSchema);
