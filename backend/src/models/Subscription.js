const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    donorName: { type: String, required: true },
    donorMobile: { type: String, required: true },
    donorEmail: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['active', 'paused', 'stopped'], default: 'active' },
    
    // Referral link
    motivatorMobile: { type: String },
    level1UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    level2UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Metadata
    planId: { type: String }, // From Gateway (e.g. Razorpay Plan ID)
    subscriptionId: { type: String }, // From Gateway
    nextBillingDate: { type: Date },
    lastPaymentDate: { type: Date },
    
    is80G: { type: Boolean, default: false },
    panNumber: { type: String },
    aadhaarNumber: { type: String }
}, {
    timestamps: true
});

// Reuse encryption hooks from Donation model
const { encrypt, decrypt } = require('../utils/security');

subscriptionSchema.pre('save', function(next) {
    if (this.isModified('panNumber')) this.panNumber = encrypt(this.panNumber);
    if (this.isModified('aadhaarNumber')) this.aadhaarNumber = encrypt(this.aadhaarNumber);
    next();
});

subscriptionSchema.post('init', function(doc) {
    if (doc.panNumber) doc.panNumber = decrypt(doc.panNumber);
    if (doc.aadhaarNumber) doc.aadhaarNumber = decrypt(doc.aadhaarNumber);
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
