const User = require('../models/User');
const Role = require('../models/Role'); // Ensure Role model is registered
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { mobile, password } = req.body;

    try {
        const user = await User.findOne({ mobile }).populate('roles');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                isSuperAdmin: user.isSuperAdmin,
                roles: user.roles,
                language: user.language,
                token: generateToken(user._id),
            });
        } else {
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
        const userExists = await User.findOne({ mobile });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let referredBy = null;
        if (req.body.referralCode) {
            const referrer = await User.findOne({ mobile: req.body.referralCode });
            if (referrer) {
                referredBy = referrer._id;
            }
        }

        const user = await User.create({
            name,
            mobile,
            email,
            password,
            referredBy
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                mobile: user.mobile,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser, registerUser };
