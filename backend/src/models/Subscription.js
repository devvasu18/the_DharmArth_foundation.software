const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/security');

const subscriptionSchema = new mongoose.Schema({
    donorName: { type: String, required: true, maxlength: 100 },
    donorMobile: { type: String, required: true, maxlength: 20 },
    donorEmail: { type: String, maxlength: 100 },
    address: { type: String, maxlength: 500 },
    city: { type: String, maxlength: 100 },
    state: { type: String, maxlength: 100 },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['created', 'active', 'paused', 'cancelled', 'expired'], default: 'created' },
    
    // Referral link
    motivatorMobile: { type: String, maxlength: 20 },
    level1UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    level2UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    donorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Metadata
    planId: { type: String }, // From Gateway (e.g. Razorpay Plan ID)
    subscriptionId: { type: String, unique: true, sparse: true }, // From Gateway
    currentCycle: { type: Number, default: 0 },
    totalCycles: { type: Number, default: 0 }, // 0 for infinite
    nextBillingDate: { type: Date },
    lastPaymentDate: { type: Date },
    lastPaymentId: { type: String },
    
    is80G: { type: Boolean, default: false },
    panNumber: { 
        type: String, 
        set: encrypt,
        get: decrypt
    },
    aadhaarNumber: { 
        type: String, 
        set: encrypt,
        get: decrypt
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
