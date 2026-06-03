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
        enum: ['government', 'clinic', 'both'],
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
    defaultTimeSlots: {
        type: [{
            period: {
                type: String,
                enum: ['Morning', 'Afternoon', 'Evening'],
                required: true
            },
            startTime: {
                type: String,
                required: true
            },
            endTime: {
                type: String,
                required: true
            },
            hospitalType: {
                type: String,
                enum: ['government', 'clinic'],
                required: true,
                default: 'government'
            }
        }],
        default: [
            { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType: 'government' },
            { period: 'Afternoon', startTime: '14:00', endTime: '17:00', hospitalType: 'government' },
            { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType: 'clinic' },
            { period: 'Afternoon', startTime: '14:00', endTime: '17:00', hospitalType: 'clinic' }
        ]
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
doctorSchema.pre('save', async function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Doctor', doctorSchema);
