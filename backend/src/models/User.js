const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../utils/security');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true // Allows null/unique
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
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
        sparse: true // Only for motivators
    },
    isMotivator: {
        type: Boolean,
        default: false
    },
    payoutCredentials: {
        bankName: String,
        accountHolder: String,
        accountNumber: String,
        ifscCode: String,
        upiId: String,
        isVerified: { type: Boolean, default: false }
    },
    language: {
        type: String,
        default: 'hi',
        enum: ['en', 'hi']
    },
    isSuspended: {
        type: Boolean,
        default: false
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
    }]
}, {
    timestamps: true,
});

// Encrypt password and sensitive details
userSchema.pre('save', async function () {
    // Password
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    
    // Banking Credentials
    if (this.isModified('payoutCredentials.accountNumber') && this.payoutCredentials.accountNumber) {
        this.payoutCredentials.accountNumber = encrypt(this.payoutCredentials.accountNumber);
    }
    if (this.isModified('payoutCredentials.ifscCode') && this.payoutCredentials.ifscCode) {
        this.payoutCredentials.ifscCode = encrypt(this.payoutCredentials.ifscCode);
    }
});

userSchema.post('init', function(doc) {
    if (doc.payoutCredentials?.accountNumber) {
        doc.payoutCredentials.accountNumber = decrypt(doc.payoutCredentials.accountNumber);
    }
    if (doc.payoutCredentials?.ifscCode) {
        doc.payoutCredentials.ifscCode = decrypt(doc.payoutCredentials.ifscCode);
    }
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
