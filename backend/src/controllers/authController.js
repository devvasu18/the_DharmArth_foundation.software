const User = require('../models/User');
const Role = require('../models/Role'); // Ensure Role model is registered
const generateToken = require('../utils/generateToken');

// Helper to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: true, // Always true for cross-site cookies
        sameSite: 'None', // Required for cross-site cookies (Vercel -> Render)
    };

    res.status(statusCode).cookie('token', token, options).json({
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
        lastMotivatorMobile: user.lastMotivatorMobile,
        payoutCredentials: user.payoutCredentials,
    });
};


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

            return sendTokenResponse(user, 200, res);
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
        const potentialReferralCode = req.body.referralCode || (user ? user.lastMotivatorMobile : null);

        if (potentialReferralCode) {
            const referrer = await User.findOne({ 
                $or: [
                    { mobile: potentialReferralCode },
                    { referralCode: String(potentialReferralCode).toUpperCase() }
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
            return sendTokenResponse(user, 201, res);
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

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: true,
        sameSite: 'None',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

module.exports = { loginUser, registerUser, logoutUser, checkReferral, checkUserStatus };

