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

    const userObj = user.toObject({ getters: true });

    res.status(statusCode).cookie('token', token, options).json({
        token, // Add this for incognito/third-party cookie fallback
        _id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        mobile: userObj.mobile,
        isSuperAdmin: userObj.isSuperAdmin,
        roles: userObj.roles,
        referredBy: userObj.referredBy ? {
            name: userObj.referredBy.name,
            mobile: userObj.referredBy.mobile
        } : null,
        language: userObj.language,
        isMotivator: userObj.isMotivator,
        referralCode: userObj.referralCode,
        lastMotivatorMobile: userObj.lastMotivatorMobile,
        payoutCredentials: userObj.payoutCredentials,
    });
};


// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { identifier, mobile, password } = req.body;
    const searchId = identifier || mobile;

    try {
        const user = await User.findOne({
            $or: [
                { mobile: searchId },
                { email: searchId?.toLowerCase() }
            ]
        }).populate('roles').populate('referredBy', 'name mobile');

        const dummyPassword = "$2a$10$abcdefghijklmnopqrstuv"; 
        const isValid = user ? await user.matchPassword(password) : await require('bcryptjs').compare(password, dummyPassword);

        if (user && isValid) {
            if (user.isSuspended) {
                return res.status(403).json({ message: 'Account suspended. Please contact Support Team.' });
            }

            return sendTokenResponse(user, 200, res);
        } else {
            res.status(401).json({ message: 'Invalid credentials or password' });
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
        // 1. Check if mobile already exists with a password
        let user = await User.findOne({ mobile });
        if (user && user.password) {
            return res.status(400).json({ message: 'Mobile number already registered' });
        }

        // 2. Check if email already exists in another account
        if (email) {
            const emailExists = await User.findOne({ email: email.toLowerCase() });
            if (emailExists && (!user || emailExists._id.toString() !== user._id.toString())) {
                return res.status(400).json({ message: 'Email address already in use by another account' });
            }
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
            
            if (referrer && referrer.mobile !== mobile) {
                referredBy = referrer._id;
            }
        }

        if (user) {
            // "Claim" account
            user.name = name || user.name;
            user.email = email ? email.toLowerCase() : user.email;
            user.password = password;
            if (referredBy) user.referredBy = referredBy;
            await user.save();
        } else {
            // New Registration
            user = await User.create({
                name,
                mobile,
                email: email ? email.toLowerCase() : undefined,
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
    const { identifier, mobile } = req.body;
    const searchId = identifier || mobile;

    try {
        const user = await User.findOne({
            $or: [
                { mobile: searchId },
                { email: searchId?.toLowerCase() }
            ]
        });

        if (!user) {
            return res.json({ exists: false });
        }

        res.json({
            exists: true,
            hasPassword: !!user.password,
            name: user.name,
            isEmail: searchId?.includes('@')
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

// @desc    Send OTP via WhatsApp
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
    const { identifier, mobile } = req.body;
    const searchId = identifier || mobile;
    const whatsappService = require('../services/whatsappService');

    try {
        const user = await User.findOne({
            $or: [
                { mobile: searchId },
                { email: searchId?.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found. Please register first.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        let success = false;
        const isEmail = searchId?.includes('@');

        if (isEmail && user.email) {
            success = await whatsappService.sendOTPByEmail(user.email, otp, user.name);
        } else {
            success = await whatsappService.sendOTP(user.mobile, otp);
        }

        if (success) {
            res.json({ 
                success: true, 
                message: `OTP sent successfully to ${isEmail ? 'your email' : 'WhatsApp'}`,
                isEmail
            });
        } else {
            res.status(500).json({ message: `Failed to send OTP via ${isEmail ? 'email' : 'WhatsApp'}` });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP and Login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    const { identifier, mobile, otp } = req.body;
    const searchId = identifier || mobile;

    try {
        const user = await User.findOne({
            $or: [
                { mobile: searchId },
                { email: searchId?.toLowerCase() }
            ]
        }).populate('roles').populate('referredBy', 'name mobile');

        if (!user || !user.otp || user.otp !== otp || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: 'Account suspended. Please contact Support Team.' });
        }

        // Clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        return sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password via OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { identifier, mobile, otp, newPassword } = req.body;
    const searchId = identifier || mobile;

    try {
        const user = await User.findOne({
            $or: [
                { mobile: searchId },
                { email: searchId?.toLowerCase() }
            ]
        });

        if (!user || !user.otp || user.otp !== otp || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Set new password
        user.password = newPassword; 
        
        // Clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Auto-login after reset
        return sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser, registerUser, logoutUser, checkReferral, checkUserStatus, sendOTP, verifyOTP, resetPassword };

