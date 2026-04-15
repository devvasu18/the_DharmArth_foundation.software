const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Encrypt password
// Encrypt password
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
