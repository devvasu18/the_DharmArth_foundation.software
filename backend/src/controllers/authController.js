const User = require('../models/User');
const Role = require('../models/Role'); // Ensure Role model is registered
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { mobile, password } = req.body;

    try {
        const user = await User.findOne({ mobile }).populate('roles').populate('referredBy', 'name mobile');

        // NORMALIZING RESPONSE TIME: We check password even if user is not found
        // This prevents Timing Attacks (Target #5)
        const dummyPassword = "$2a$10$abcdefghijklmnopqrstuv"; // A fake hash
        const isValid = user ? await user.matchPassword(password) : await require('bcryptjs').compare(password, dummyPassword);

        if (user && isValid) {
            if (user.isSuspended) {
                return res.status(403).json({ message: 'Account suspended. Please contact Support Team.' });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                isSuperAdmin: user.isSuperAdmin,
                roles: user.roles,
                referredBy: user.referredBy ? {
                    name: user.referredBy.name,
                    mobile: user.referredBy.mobile
                } : null,
                language: user.language,
                isMotivator: user.isMotivator,
                referralCode: user.referralCode,
                payoutCredentials: user.payoutCredentials,
                token: generateToken(user._id),
            });
        } else {
            // GENERIC MESSAGE: Prevents User Enumeration (Target #4)
            res.status(401).json({ message: 'Invalid mobile or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user (Public)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, mobile, email, password } = req.body;

    try {
        let user = await User.findOne({ mobile });

        if (user && user.password) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let referredBy = null;
        if (req.body.referralCode) {
            const referrer = await User.findOne({ 
                $or: [
                    { mobile: req.body.referralCode },
                    { referralCode: String(req.body.referralCode).toUpperCase() }
                ]
            });
            
            // PREVENT RECURSIVE/SELF REFERRAL (Target #1)
            if (referrer && referrer.mobile !== mobile) {
                referredBy = referrer._id;
            }
        }

        if (user) {
            // "Claim" account (Existing guest donor with no password)
            user.name = name || user.name;
            user.email = email || user.email;
            user.password = password; // pre('save') hook will hash this
            if (referredBy) user.referredBy = referredBy;
            await user.save();
        } else {
            // New Registration
            user = await User.create({
                name,
                mobile,
                email: email || undefined,
                password,
                referredBy
            });
        }

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                mobile: user.mobile,
                email: user.email,
                referralCode: user.referralCode,
                referredBy: user.referredBy ? {
                    name: (await User.findById(user.referredBy)).name,
                    mobile: (await User.findById(user.referredBy)).mobile
                } : null,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Register/Claim Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check referral code (mobile) and return name
// @route   POST /api/auth/check-referral
// @access  Public
const checkReferral = async (req, res) => {
    const { referralCode } = req.body;

    try {
        const user = await User.findOne({ mobile: referralCode });

        if (user) {
            res.json({
                isValid: true,
                name: user.name
            });
        } else { // Corrected: Using else block for 404 response
            res.status(404).json({ message: 'Referral code not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check user status (exists/claimed)
// @route   POST /api/auth/check-status
// @access  Public
const checkUserStatus = async (req, res) => {
    const { mobile } = req.body;

    try {
        const user = await User.findOne({ mobile });

        if (!user) {
            return res.json({ exists: false });
        }

        res.json({
            exists: true,
            hasPassword: !!user.password,
            name: user.name
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser, registerUser, checkReferral, checkUserStatus };
