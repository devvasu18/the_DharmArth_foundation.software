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

// ============================================================
// DELETE ACCOUNT FEATURE (Play Store Compliance)
// ============================================================

// @desc    Send OTP to user for account deletion (with pre-flight checks)
// @route   POST /api/users/delete-account/send-otp
// @access  Private (logged-in user only)
router.post('/delete-account/send-otp', protect, async (req, res) => {
    try {
        const whatsappService = require('../services/whatsappService');
        const Order = require('../models/Order');
        const PayoutRequest = require('../models/PayoutRequest');
        const Subscription = require('../models/Subscription');

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (user.isDeleted) return res.status(400).json({ message: 'Account is already deleted.' });
        if (user.isSuperAdmin) return res.status(403).json({ message: 'Super Admin accounts cannot be deleted via this route.' });

        // --- PRE-FLIGHT CHECK 1: Active Orders ---
        const activeOrders = await Order.countDocuments({
            user: user._id,
            status: { $in: ['Awaiting Approval', 'Payment Pending', 'Processing', 'Out for Delivery'] }
        });
        if (activeOrders > 0) {
            return res.status(400).json({
                blocked: true,
                reason: 'active_orders',
                message: `You have ${activeOrders} active order(s). Please wait for delivery or contact support before deleting your account.`,
                count: activeOrders
            });
        }

        // --- PRE-FLIGHT CHECK 2: Pending Payout Requests ---
        if (user.isMotivator) {
            const pendingPayouts = await PayoutRequest.countDocuments({
                user: user._id,
                status: { $in: ['pending', 'approved', 'exported'] }
            });
            if (pendingPayouts > 0) {
                return res.status(400).json({
                    blocked: true,
                    reason: 'pending_payouts',
                    message: `You have ${pendingPayouts} pending payout request(s). Please wait for them to be processed before deleting your account.`,
                    count: pendingPayouts
                });
            }
        }

        // --- PRE-FLIGHT CHECK 3: Active Subscriptions ---
        const activeSubscriptions = await Subscription.countDocuments({
            donorUserId: user._id,
            status: { $in: ['created', 'active'] }
        });
        if (activeSubscriptions > 0) {
            return res.status(400).json({
                blocked: true,
                reason: 'active_subscriptions',
                message: `You have ${activeSubscriptions} active monthly donation subscription(s). Please cancel them first from the Subscriptions section.`,
                count: activeSubscriptions
            });
        }

        // --- WALLET BALANCE INFO (not a blocker — will be auto-donated) ---
        const wallet = await Wallet.findOne({ user: user._id });
        const walletBalance = wallet ? wallet.balance : 0;

        // --- ALL CHECKS PASSED: Send OTP ---
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        let otpSent = false;
        if (user.mobile === '9999999999' || user.mobile === '8888888888') {
            otpSent = true;
            user.otp = '123456';
            user.otpExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await user.save();
        } else {
            otpSent = await whatsappService._sendWhatsAppNow(user.mobile, 
                `Your OTP for *Account Deletion* at The DharmArth Foundation is: *${otp}*. Valid for 10 minutes. ⚠️ This action is permanent and cannot be undone.`
            );
        }

        if (!otpSent) {
            return res.status(500).json({ message: 'Failed to send OTP via WhatsApp. Please try again.' });
        }

        res.json({
            success: true,
            message: `OTP sent to your registered mobile number.`,
            walletBalance,      // Frontend shows donation warning if > 0
            maskedMobile: `${user.mobile.substring(0, 2)}XXXXXX${user.mobile.slice(-2)}`
        });

    } catch (error) {
        console.error('[DELETE ACCOUNT OTP ERROR]', error);
        res.status(500).json({ message: error.message });
    }
});


// @desc    Permanently delete user account (soft delete with snapshot)
// @route   DELETE /api/users/delete-account
// @access  Private (logged-in user only)
router.delete('/delete-account', protect, async (req, res) => {
    try {
        const { otp, reason } = req.body;

        if (!otp) return res.status(400).json({ message: 'OTP is required to confirm account deletion.' });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (user.isDeleted) return res.status(400).json({ message: 'Account is already deleted.' });
        if (user.isSuperAdmin) return res.status(403).json({ message: 'Super Admin accounts cannot be deleted.' });

        // --- VERIFY OTP ---
        const isDemoUser = user.mobile === '9999999999' || user.mobile === '8888888888';
        if (!isDemoUser && (!user.otp || user.otp !== otp || user.otpExpires < new Date())) {
            return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new OTP.' });
        }
        if (isDemoUser && otp !== '123456') {
            return res.status(400).json({ message: 'Invalid OTP. Please use the dummy OTP 123456.' });
        }

        const userId = user._id;
        const userName = user.name;
        const userMobile = user.mobile;
        const userReferralCode = user.referralCode;

        // --- Re-run pre-flight checks (safety net) ---
        const Order = require('../models/Order');
        const PayoutRequest = require('../models/PayoutRequest');
        const Subscription = require('../models/Subscription');
        const Transaction = require('../models/Transaction');
        const Prescription = require('../models/Prescription');
        const Notification = require('../models/Notification');
        const EventRegistration = require('../models/EventRegistration');
        const Donation = require('../models/Donation');

        const activeOrders = await Order.countDocuments({
            user: userId,
            status: { $in: ['Awaiting Approval', 'Payment Pending', 'Processing', 'Out for Delivery'] }
        });
        if (activeOrders > 0) {
            return res.status(400).json({ message: `Cannot delete: ${activeOrders} active order(s) exist.` });
        }

        if (user.isMotivator) {
            const pendingPayouts = await PayoutRequest.countDocuments({
                user: userId,
                status: { $in: ['pending', 'approved', 'exported'] }
            });
            if (pendingPayouts > 0) {
                return res.status(400).json({ message: `Cannot delete: ${pendingPayouts} pending payout(s) exist.` });
            }
        }

        const activeSubscriptions = await Subscription.countDocuments({
            donorUserId: userId,
            status: { $in: ['created', 'active'] }
        });
        if (activeSubscriptions > 0) {
            return res.status(400).json({ message: `Cannot delete: ${activeSubscriptions} active subscription(s) exist.` });
        }

        // ============================================================
        // WALLET BALANCE DONATION to Foundation
        // ============================================================
        const wallet = await Wallet.findOne({ user: userId });
        const walletBalance = wallet ? wallet.balance : 0;

        if (wallet && walletBalance > 0) {
            // Record the auto-donation transaction for audit trail
            await Transaction.create({
                wallet: wallet._id,
                amount: walletBalance,
                type: 'debit',
                reason: 'wallet_donation',
                description: `Auto-donated ₹${walletBalance} to The DharmArth Foundation upon account deletion by ${userName} (${userMobile})`
            });
            // Zero out the wallet balance
            wallet.balance = 0;
            await wallet.save();
        }

        // ============================================================
        // SOFT DELETE — Preserve audit trail, clear PII
        // ============================================================
        // Store a snapshot BEFORE clearing so admin can always trace commission sources
        user.deletedUserSnapshot = {
            name: userName,
            mobile: userMobile,
            referralCode: userReferralCode,
            isMotivator: user.isMotivator
        };

        // Mark as deleted
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.deletionReason = reason || 'User requested deletion';

        // Clear sensitive PII (account becomes unusable)
        user.password = undefined;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.profileImage = undefined;
        user.savedAddresses = [];
        user.payoutCredentials = undefined;
        user.email = undefined; // Free the email too

        // ⚠️  IMPORTANT: Anonymize mobile so the number is released from the unique index.
        // This allows the same person to re-register with a fresh account if they wish.
        // The original mobile is already safely stored in deletedUserSnapshot above.
        // Donation.level1UserId / level2UserId still point to this User _id (unchanged),
        // so commission history remains fully traceable via the _id reference.
        user.mobile = `DELETED_${Date.now()}_${userMobile.slice(-4)}`;

        // Also anonymize referralCode to release it from the unique index
        user.referralCode = `DEL_${userId.toString().slice(-8)}`;

        await user.save();

        // ============================================================
        // CLEAN UP: Remove truly personal data (no audit value)
        // ============================================================
        // 1. Delete prescriptions (medical data, no financial value)
        await Prescription.deleteMany({ user: userId });

        // 2. Delete personal notifications
        await Notification.deleteMany({ user: userId });

        // 3. Null the user link on event registrations (keep event attendance records)
        await EventRegistration.updateMany({ user: userId }, { $set: { user: null } });

        // 4. Mark completed payout requests as 'account_deleted' for admin visibility
        await PayoutRequest.updateMany(
            { user: userId, status: { $in: ['completed', 'failed', 'rejected'] } },
            { $set: { adminNotes: `Account deleted on ${new Date().toISOString()}` } }
        );

        // NOTE: Orders, Donations, Transactions, Wallet are kept as-is.
        // Donation.level1UserId / level2UserId still point to the (now soft-deleted) User.
        // Admin can still see who generated commission by checking deletedUserSnapshot.

        console.log(`[DELETE ACCOUNT] User ${userName} (${userMobile}) soft-deleted. Wallet auto-donated: ₹${walletBalance}`);

        res.json({
            success: true,
            message: 'Your account has been successfully deleted.',
            walletDonated: walletBalance
        });

    } catch (error) {
        console.error('[DELETE ACCOUNT ERROR]', error);
        res.status(500).json({ message: error.message });
    }
});


// @desc    Manual Account Deletion Request (Public — from web form, no auth needed)
// @route   POST /api/users/request-account-deletion
// @access  Public
router.post('/request-account-deletion', async (req, res) => {
    try {
        const { name, mobile, reason } = req.body;

        if (!name || !mobile) {
            return res.status(400).json({ message: 'Name and mobile number are required.' });
        }

        const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
        if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
            return res.status(400).json({ message: 'Please provide a valid 10-digit Indian mobile number.' });
        }

        // Check if user actually exists
        const user = await User.findOne({ mobile: cleanMobile });

        const whatsappService = require('../services/whatsappService');
        const Setting = require('../models/Setting');

        let whatsappSent = false;

        // Notify admin (non-blocking — WhatsApp failure won't kill the request)
        try {
            const adminMobileSetting = await Setting.findOne({ key: 'admin_suspension_mobile' });
            const adminMobile = adminMobileSetting?.value || process.env.ADMIN_MOBILE;

            if (adminMobile) {
                await whatsappService._sendWhatsAppNow(adminMobile,
                    `🗑️ *Manual Account Deletion Request*\n\n` +
                    `Name: ${name}\n` +
                    `Mobile: ${cleanMobile}\n` +
                    `Account Found: ${user ? 'Yes' : 'No'}\n` +
                    `Reason: ${reason || 'Not provided'}\n\n` +
                    `Please verify and delete manually within 7 working days.`
                );
            }
        } catch (waErr) {
            console.warn('[DELETE REQUEST] Admin WhatsApp notification failed (service may be down):', waErr.message);
        }

        // Send confirmation to requester (non-blocking)
        try {
            await whatsappService.sendMessage(cleanMobile,
                `🙏 Dear ${name}, we have received your account deletion request for The DharmArth Foundation app.\n\n` +
                `Our team will verify your identity and process it within *7 working days*.\n\n` +
                `If you need urgent assistance, email us at thedharmarth@gmail.com`
            );
            whatsappSent = true;
        } catch (waErr) {
            console.warn('[DELETE REQUEST] User WhatsApp confirmation failed (service may be down):', waErr.message);
        }

        res.json({
            success: true,
            message: whatsappSent
                ? 'Your deletion request has been submitted. You will receive a WhatsApp confirmation shortly.'
                : 'Your deletion request has been submitted. Our team will contact you within 7 working days.',
            whatsappSent
        });

    } catch (error) {
        console.error('[MANUAL DELETION REQUEST ERROR]', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

