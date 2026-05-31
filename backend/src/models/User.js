const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../utils/security');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 100,
    },
    email: {
        type: String,
        unique: true,
        sparse: true, // Allows null/unique
        maxlength: 100,
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false, // Optional initially for guest donors
    },
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],
    isSuperAdmin: {
        type: Boolean,
        default: false
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true // Allows nulls while ensuring uniqueness for existing values
    },
    isMotivator: {
        type: Boolean,
        default: false
    },
    payoutCredentials: {
        bankName: { type: String, maxlength: 100 },
        accountHolder: { type: String, maxlength: 100 },
        accountNumber: { 
            type: String, 
            maxlength: 200, // increased to allow encrypted string length
            set: encrypt,
            get: decrypt
        },
        ifscCode: { 
            type: String, 
            maxlength: 150, // increased to allow encrypted string length
            set: encrypt,
            get: decrypt
        },
        isVerified: { type: Boolean, default: false }
    },
    language: {
        type: String,
        default: 'hi',
        enum: ['en', 'hi']
    },
    address: String,
    city: String,
    state: String,
    profileImage: String, // Cloudinary URL
    work: { type: String, maxlength: 100 }, // Designation/Profession
    bio: { type: String, maxlength: 500 }, // Short personal bio
    lastMotivatorMobile: String,
    isSuspended: {
        type: Boolean,
        default: false
    },
    // Soft Delete fields (used instead of hard delete to preserve commission/referral audit trails)
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletionReason: {
        type: String,
        maxlength: 500
    },
    // Snapshot of identity at time of deletion — so admin can still trace commission sources
    deletedUserSnapshot: {
        name: String,
        mobile: String,
        referralCode: String,
        isMotivator: Boolean
    },
    savedAddresses: [{
        street: String,
        city: String,
        state: String,
        zip: String,
        phone: String,
        altPhone: String,
        label: { type: String, default: 'Home' },
        updatedAt: { type: Date, default: Date.now }
    }],
    otp: { type: String },
    otpExpires: { type: Date },
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Encrypt password and sensitive details
userSchema.pre('save', async function () {
    // 1. Password Encryption
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    
    // 2. Automated Referral Code Generation
    if (!this.referralCode) {
        try {
            const namePart = (this.name || 'USER').split(' ')[0] || 'USER';
            const prefix = namePart.substring(0, 4).toUpperCase();
            const suffix = (this.mobile || '0000').slice(-4);
            let code = `${prefix}${suffix}`;
            
            // Uniqueness check (Self-correction if duplicate)
            const exists = await mongoose.model('User').findOne({ referralCode: code });
            if (exists) {
                code = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
            }
            this.referralCode = code;
        } catch (err) {
            console.error("Referral Code Hook Error:", err);
        }
    }
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
