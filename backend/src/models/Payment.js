const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    transaction_id: {
        type: String,
        unique: true,
        required: true
    },
    order_id: {
        type: String,
        required: true,
        index: true
    },
    payment_id: {
        type: String,
        sparse: true,
        index: true
    },
    status: {
        type: String,
        enum: ['created', 'paid', 'failed'],
        default: 'created'
    },
    payment_method: {
        type: String
    },
    email: {
        type: String
    },
    contact: {
        type: String
    },
    raw_webhook_data: {
        type: Object // For auditing purposes
    },
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
        required: false
    },
    type: {
        type: String,
        enum: ['donation', 'prescription'],
        default: 'donation'
    }
}, {
    timestamps: true
});

// Idempotency: Ensure we don't process the same order twice for payment
paymentSchema.index({ order_id: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
