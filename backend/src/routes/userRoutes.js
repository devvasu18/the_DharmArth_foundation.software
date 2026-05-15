const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

// @desc    Send OTP to Admin for User Suspension
// @route   POST /api/users/admin/send-suspension-otp
// @access  Private/Admin
router.post('/admin/send-suspension-otp', protect, checkPermission('User Management', 'edit'), async (req, res) => {
    console.log("[OTP] Received request to send suspension OTP");
    try {
        const Setting = require('../models/Setting');
        const whatsappService = require('../services/whatsappService');
        
        const setting = await Setting.findOne({ key: 'admin_suspension_mobile' });
        const adminMobile = setting ? setting.value : process.env.ADMIN_MOBILE;

        if (!adminMobile) {
            return res.status(400).json({ message: 'Admin mobile not configured in settings.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Store OTP on the performing admin's record
        const admin = await User.findById(req.user._id);
        admin.otp = otp;
        admin.otpExpires = otpExpires;
        await admin.save();

        const success = await whatsappService.sendSuspensionOTP(adminMobile, otp);
        if (success) {
            res.json({ success: true, message: `OTP sent to Admin Mobile (${adminMobile.substring(0, 2)}******${adminMobile.substring(8)})` });
        } else {
            res.status(500).json({ message: 'Failed to send OTP to Admin via WhatsApp.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Get all normal users (non-staff)
// @route   GET /api/users
// @access  Private/Admin
// @desc    Get all users with pagination and filtering
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, checkPermission('User Management', 'view'), async (req, res) => {
    try {
        const { page = 1, limit = 20, search, startDate, endDate, specificUserId } = req.query;

        // Build Match Query
        const query = {
            isSuperAdmin: false,
            roles: { $size: 0 }
        };

        // Specific User ID (for exact selection)
        if (specificUserId) {
            query._id = specificUserId;
        }

        // Search Filter (Name, Mobile, Email)
        if (search) {
            const searchRegex = new RegExp(search, 'i'); // Case-insensitive
            query.$or = [
                { name: searchRegex },
                { mobile: searchRegex },
                { email: searchRegex },
                { referralCode: searchRegex }
            ];
        }

        // Date Filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Calculate Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute Query
        const totalUsers = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .populate('roles')
            .populate('referredBy', 'name mobile')
            .sort({ createdAt: req.query.sort === 'asc' ? 1 : -1 }) // Dynamic sort
            .skip(skip)
            .limit(limitNum);

        // Fetch user ids for wallet fetching
        const userIds = users.map(u => u._id);

        // Fetch wallets for these users only
        const wallets = await Wallet.find({ user: { $in: userIds } });
        const walletMap = {};
        wallets.forEach(w => {
            if (w.user) walletMap[w.user.toString()] = w.balance;
        });

        // Resolve lastMotivatorMobile -> name for users without referredBy
        const mobilesToResolve = users
            .filter(u => !u.referredBy && u.lastMotivatorMobile)
            .map(u => u.lastMotivatorMobile);

        let motivatorMap = {};
        if (mobilesToResolve.length > 0) {
            const motivators = await User.find({ mobile: { $in: mobilesToResolve } }).select('name mobile');
            motivators.forEach(m => { motivatorMap[m.mobile] = m.name; });
        }

        const usersWithWallet = users.map(user => ({
            ...user.toObject(),
            walletBalance: walletMap[user._id.toString()] || 0,
            lastMotivatorName: (!user.referredBy && user.lastMotivatorMobile)
                ? (motivatorMap[user.lastMotivatorMobile] || null)
                : undefined
        }));

        res.json({
            users: usersWithWallet,
            pagination: {
                totalUsers,
                totalPages: Math.ceil(totalUsers / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all staff members (users with roles or superadmin)
// @route   GET /api/users/staff
// @access  Private/SuperAdmin
router.get('/staff', protect, async (req, res) => {
    // Restrict to Super Admin or Users with Role Management view permission
    if (!req.user.isSuperAdmin) {
        // Check manually if middleware not used
        const hasPerm = req.user.roles && req.user.roles.some(r =>
            r.permissions && r.permissions.some(p => p.module === 'Role Management' && p.actions.includes('view'))
        );
        if (!hasPerm) {
            return res.status(403).json({ message: 'Access denied' });
        }
    }

    try {
        const staff = await User.find({
            $or: [
                { isSuperAdmin: true },
                { roles: { $not: { $size: 0 } } }
            ]
        })
            .select('-password')
            .populate('roles');

        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('referredBy', 'name mobile referralCode');
            
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add or Update an Address
// @route   POST /api/users/profile/addresses
// @access  Private
router.post('/profile/addresses', protect, async (req, res) => {
    // Owner check is implicit because we use req.user._id
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const addressData = req.body;
        
        if (addressData._id) {
            // Update existing
            const addrIndex = user.savedAddresses.findIndex(a => a._id.toString() === addressData._id);
            if (addrIndex >= 0) {
                user.savedAddresses[addrIndex].street = addressData.street;
                user.savedAddresses[addrIndex].city = addressData.city;
                user.savedAddresses[addrIndex].state = addressData.state;
                user.savedAddresses[addrIndex].zip = addressData.zip;
                user.savedAddresses[addrIndex].phone = addressData.phone;
                user.savedAddresses[addrIndex].updatedAt = Date.now();
            }
        } else {
            // Add new
            user.savedAddresses.push(addressData);
        }
        
        await user.save();
        res.json(user.savedAddresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin (with View User permission)
router.get('/:id', protect, checkPermission('User Management', 'view'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('roles')
            .populate('referredBy', 'name mobile');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const wallet = await Wallet.findOne({ user: user._id });
        const userWithWallet = {
            ...user.toObject(),
            walletBalance: wallet ? wallet.balance : 0
        };

        res.json(userWithWallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Suspend/Unsuspend User
// @route   PUT /api/users/:id/suspend
// @access  Private/Admin (Edit User permission)
router.put('/:id/suspend', protect, checkPermission('User Management', 'edit'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isSuperAdmin) {
            return res.status(400).json({ message: 'Cannot suspend Super Admin' });
        }

        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ message: 'OTP is required for suspension actions.' });
        }

        // Verify OTP against the performing admin
        const admin = await User.findById(req.user._id);
        if (!admin || !admin.otp || admin.otp !== otp || admin.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        admin.otp = undefined;
        admin.otpExpires = undefined;
        await admin.save();

        user.isSuspended = !user.isSuspended;
        await user.save();

        res.json({
            message: `User ${user.isSuspended ? 'suspended' : 'activated'}`,
            isSuspended: user.isSuspended
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create Staff Member
// @route   POST /api/users/staff
// @access  Private/SuperAdmin
router.post('/staff', protect, async (req, res) => {
    if (!req.user.isSuperAdmin) {
        return res.status(403).json({ message: 'Only Super Admin can create staff' });
    }

    const { name, mobile, email, password, roleId } = req.body;
    console.log("Creating staff:", { name, mobile, email, roleId });

    try {
        const checkQuery = { mobile };
        let user = await User.findOne(checkQuery);

        if (user) {
            return res.status(400).json({ message: 'A user with this mobile number already exists in the system. Delivery Boy accounts must use a unique, unregistered number.' });
        }

        // Case 3: User does not exist, create new
        const emailExists = email ? await User.findOne({ email }) : null;
        if (emailExists) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }

        user = await User.create({
            name,
            mobile,
            email: email || undefined,
            password,
            roles: [roleId]
        });

        // Create Wallet for new staff
        await Wallet.create({ user: user._id });

        res.status(201).json({ message: 'New Staff account created successfully', user });
    } catch (error) {
        console.error("Staff Creation Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Toggle Staff Status
// @route   PUT /api/users/staff/:id/status
// @access  Private/SuperAdmin or Admin with permission
router.put('/staff/:id/status', protect, async (req, res) => {
    // Check permission
    if (!req.user.isSuperAdmin) {
        const hasPerm = req.user.roles && req.user.roles.some(r =>
            r.permissions && r.permissions.some(p => p.module === 'Role Management' && p.actions.includes('edit'))
        );
        if (!hasPerm) {
            return res.status(403).json({ message: 'Access denied' });
        }
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Staff member not found' });
        if (user.isSuperAdmin) return res.status(400).json({ message: 'Cannot suspend Super Admin' });

        user.isSuspended = !user.isSuspended;
        await user.save();

        res.json({ message: `Staff status updated`, isSuspended: user.isSuspended });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign Role to User
// @route   POST /api/users/assign-role
// @access  Private/Admin
router.post('/assign-role', protect, checkPermission('Role Management', 'edit'), async (req, res) => {
    const { userId, roleIds } = req.body; // roleIds is array of Role IDs
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.roles = roleIds;
        await user.save();

        res.json({ message: 'Roles updated', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update User Language
// @route   PUT /api/users/language
// @access  Private
router.put('/language', protect, async (req, res) => {
    // Owner check implicit via req.user._id
    const { language } = req.body;
    console.log("Updating language for user:", req.user?._id, "to", language);
    if (!['en', 'hi'].includes(language)) {
        console.log("Invalid language:", language);
        return res.status(400).json({ message: 'Invalid language' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.language = language;
            await user.save();
            res.json({ message: 'Language updated', language: user.language });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Language Update Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Become a Motivator
// @route   PUT /api/users/become-motivator
// @access  Private
router.put('/become-motivator', protect, async (req, res) => {
    // Owner check implicit via req.user._id
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { bankName, accountHolder, accountNumber, ifscCode } = req.body;

        console.log(`Starting motivator registration for user: ${user.mobile} (${user.name})`);

        // 1. Generate referralCode if not exists is now handled by User model pre('save') hook
        
        user.isMotivator = true;
        user.payoutCredentials = {
            bankName: bankName || '',
            accountHolder: accountHolder || '',
            accountNumber: accountNumber || '',
            ifscCode: ifscCode || '',
            isVerified: false 
        };

        await user.save();
        console.log(`Motivator registration successful for: ${user.mobile}`);

        const sanitizedUser = user.toObject();
        delete sanitizedUser.password;
        


        res.json({
            message: 'Successfully registered as Motivator',
            user: sanitizedUser
        });

    } catch (error) {
        console.error("Become Motivator Error:", error);
        res.status(500).json({ 
            message: error.message,
            detail: "Internal server error during motivator registration" 
        });
    }
});

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, work, bio, city, state, address, profileImage, email } = req.body;

        if (name) user.name = name;
        if (work !== undefined) user.work = work;
        if (bio !== undefined) user.bio = bio;
        if (city !== undefined) user.city = city;
        if (state !== undefined) user.state = state;
        if (address !== undefined) user.address = address;
        if (profileImage !== undefined) user.profileImage = profileImage;
        if (email) user.email = email;

        await user.save();
        
        const sanitized = user.toObject();
        delete sanitized.password;
        
        res.json({
            message: 'Profile updated successfully',
            user: sanitized
        });
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Lookup guest name by mobile
// @route   GET /api/users/guest-lookup/:mobile
// @access  Public
router.get('/guest-lookup/:mobile', async (req, res) => {
    try {
        const user = await User.findOne({ mobile: req.params.mobile }).select('name password');
        if (!user) {
            return res.status(404).json({ message: 'Guest not found' });
        }
        // If user has a password, it's not a guest
        if (user.password) {
            return res.status(401).json({ message: 'User is registered. Please login.' });
        }
        res.json({ name: user.name });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get public profile by referral code
// @route   GET /api/users/v/:referralCode
// @access  Public
router.get('/v/:referralCode', async (req, res) => {
    try {
        const user = await User.findOne({ 
            $or: [
                { referralCode: req.params.referralCode.toUpperCase() },
                { mobile: req.params.referralCode }
            ]
        })
            .select('name work bio profileImage city state mobile referralCode createdAt isMotivator');
            
        if (!user) {
            return res.status(404).json({ message: 'Volunteer profile not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
