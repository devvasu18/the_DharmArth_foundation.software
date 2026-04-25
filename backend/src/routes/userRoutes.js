const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

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
                { email: searchRegex }
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

        const usersWithWallet = users.map(user => ({
            ...user.toObject(),
            walletBalance: walletMap[user._id.toString()] || 0
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
            // Case 1: User exists and already has roles (or is super admin)
            if (user.roles.length > 0 || user.isSuperAdmin) {
                console.log("Promotion attempt: User is already staff", user.mobile);
                return res.status(400).json({ message: 'This user is already registered as a staff member.' });
            }

            // Case 2: User exists as a normal customer, promote them
            console.log("Promoting existing user to staff:", user.mobile);
            user.roles.push(roleId);
            if (name) user.name = name; // Update name if provided
            if (email && email.trim() !== '') user.email = email;
            
            await user.save();
            return res.status(200).json({ message: 'Existing user has been promoted to Staff successfully!', user });
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

        const { bankName, accountHolder, accountNumber, ifscCode, upiId } = req.body;

        console.log(`Starting motivator registration for user: ${user.mobile} (${user.name})`);

        // 1. Generate referralCode if not exists is now handled by User model pre('save') hook
        
        user.isMotivator = true;
        user.payoutCredentials = {
            bankName: bankName || '',
            accountHolder: accountHolder || '',
            accountNumber: accountNumber || '',
            ifscCode: ifscCode || '',
            upiId: upiId || '',
            isVerified: false 
        };

        await user.save();
        console.log(`Motivator registration successful for: ${user.mobile}`);

        const sanitizedUser = user.toObject();
        delete sanitizedUser.password;
        
        // Ensure decrypted values are sent back to frontend
        if (sanitizedUser.payoutCredentials?.accountNumber) {
            const { decrypt } = require('../utils/security');
            sanitizedUser.payoutCredentials.accountNumber = decrypt(sanitizedUser.payoutCredentials.accountNumber);
        }
        if (sanitizedUser.payoutCredentials?.ifscCode) {
            const { decrypt } = require('../utils/security');
            sanitizedUser.payoutCredentials.ifscCode = decrypt(sanitizedUser.payoutCredentials.ifscCode);
        }

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

module.exports = router;
