const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    guestName: String,
    guestMobile: String,
    image: {
        type: String,
        required: false // Cloudinary URL (Optional for admin orders)
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Verified', 'Rejected', 'Ordered'],
        default: 'Pending'
    },
    orderSource: {
        type: String,
        enum: ['Website', 'Created by Medical/Admin'],
        default: 'Website'
    },
    notes: String,
    faqAnswers: [{
        question: String,
        answer: String
    }],
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
        fulfillmentStatus: { 
            type: String, 
            enum: ['In Stock', 'Shortlisted'], 
            default: 'In Stock' 
        },
        estimatedArrivalDays: Number,
        alternativeSuggested: String,
        margPID: Number,
        margPack: Number,
        margBatch: String,
        margExpiry: String,
        margBillNo: String
    }],
    userApproved: { type: Boolean, default: false },
    approvalRequired: { type: Boolean, default: false },
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
