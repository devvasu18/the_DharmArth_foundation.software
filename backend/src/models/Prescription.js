const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    image: {
        type: String,
        required: true // Cloudinary URL
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Verified', 'Rejected', 'Ordered'],
        default: 'Pending'
    },
    verifiedItems: [{
        medicineName: String,
        dosage: String,
        frequency: String,
        time: String,
        foodRelation: String,
        intakeMethod: String,
        duration: String,
        quantity: Number,
        price: Number,
        isAvailable: { type: Boolean, default: true },
        alternativeSuggested: String
    }],
    rejectionReason: String,
    adminNote: String,
    verificationLog: [{
        status: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
        note: String
    }],
    pendingShippingAddress: {
        street: String,
        city: String,
        state: String,
        zip: String,
        phone: String,
        altPhone: String
    }
}, {
    timestamps: true
});

// Indexes for performance
prescriptionSchema.index({ user: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ createdAt: -1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;
