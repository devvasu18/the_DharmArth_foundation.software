const mongoose = require('mongoose');

const doctorReportSchema = new mongoose.Schema({
    patientName: {
        type: String,
        trim: true
    },
    patientMobile: {
        type: String,
        required: true,
        trim: true
    },
    reportUrl: {
        type: String
    },
    fileName: {
        type: String
    },
    cloudinaryPublicId: {
        type: String
    },
    remarks: {
        type: String,
        trim: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    secureToken: {
        type: String,
        required: true,
        unique: true
    },
    whatsappStatus: {
        type: String,
        enum: ['pending', 'processing', 'sent', 'delivered', 'read', 'failed'],
        default: 'pending'
    },
    sentAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    readAt: {
        type: Date
    },
    retryCount: {
        type: Number,
        default: 0
    },
    failureReason: {
        type: String,
        default: ''
    },
    scheduledAt: {
        type: Date,
        default: Date.now
    },
    templateLanguage: {
        type: String,
        enum: ['en', 'hi'],
        default: 'hi'
    },
    customMessage: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DoctorReport', doctorReportSchema);
