const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const User = require('../models/User');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');
const { processDonationCommission } = require('../services/commissionService');
const certificateService = require('../services/certificateService');
const whatsappService = require('../services/whatsappService');
const { protect, optionalProtect, adminOnly } = require('../middlewares/authMiddleware');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer Storage for 80G Certificates
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../public/certificates/manual');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `80G_${req.params.id}_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed'), false);
    }
});

// Rate limiter for initiating donations: 5 attempts per hour per IP
const donationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, 
    message: { message: 'Too many donation attempts from this IP, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// @desc    Get All Donations (Admin)
// @route   GET /api/donate
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const { month, year, pending80G, is80G } = req.query;
        let filter = {};

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            filter.createdAt = { $gte: startDate, $lte: endDate };
        }

        if (pending80G === 'true') {
            filter.is80G = true;
            filter.is80GUploaded = { $ne: true };
            filter.status = 'success';
        } else if (is80G === 'true') {
            filter.is80G = true;
            filter.is80GUploaded = true;
            filter.status = 'success';
        }

        const donations = await Donation.find(filter)
            .populate('level1UserId', 'name mobile')
            .populate('level2UserId', 'name mobile')
            .sort({ createdAt: -1 });
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get My Donations (Logged in user by mobile)
// @route   GET /api/donate/my-donations
router.get('/my-donations', protect, async (req, res) => {
    try {
        const donations = await Donation.find({ donorMobile: req.user.mobile }).sort({ createdAt: -1 });
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Initiate Donation (Razorpay Order)
// @route   POST /api/donate
router.post('/', donationLimiter, optionalProtect, async (req, res) => {
    const { sanitizeString } = require('../utils/sanitizer');
    
    const {
        amount,
        donorName: rawName,
        donorMobile,
        donorEmail: rawEmail,
        motivatorMobile,
        referralSource,
        panNumber,
        aadhaarNumber,
        address: rawAddress,
        city: rawCity,
        state: rawState
    } = req.body;

    // Sanitize strings
    const donorName = sanitizeString(rawName, 50);
    const donorEmail = sanitizeString(rawEmail, 100);
    const address = sanitizeString(rawAddress, 200);
    const city = sanitizeString(rawCity, 50);
    const state = sanitizeString(rawState, 50);

    // Validation
    if (!amount || !donorName || !donorMobile) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        console.log('[DEBUG] Full Request Body:', JSON.stringify(req.body, null, 2));
        const { donationType = 'one-time' } = req.body;
        console.log(`[DEBUG] Incoming Donation Request: type=${donationType}, mobile=${donorMobile}, amount=${amount}`);

        // Prepare Commission Fields
        let level1UserId = null;
        let level2UserId = null;

        let finalMotivatorMobile = motivatorMobile;

        // Backend Protection: If user is logged in, prioritize their existing motivator
        if (req.user) {
            const user = await User.findById(req.user._id).populate('referredBy');
            if (user && user.referredBy) {
                finalMotivatorMobile = user.referredBy.mobile || user.referredBy.referralCode;
            } else if (user && user.lastMotivatorMobile) {
                finalMotivatorMobile = user.lastMotivatorMobile;
            }
        }

        if (finalMotivatorMobile) {
            const motivator = await User.findOne({
                $or: [
                    { mobile: finalMotivatorMobile },
                    { referralCode: finalMotivatorMobile.toUpperCase() }
                ]
            }).populate('referredBy');

            if (motivator) {
                level1UserId = motivator._id;
                if (motivator.referredBy) {
                    level2UserId = motivator.referredBy._id;
                }
            }
        }

        // self-referral check
        const isSelfReferral = donorMobile === finalMotivatorMobile || 
                             (level1UserId && level1UserId.toString() === donorMobile);

        if (donationType === 'monthly') {
            const Subscription = require('../models/Subscription');
            const { getOrCreatePlan } = require('../utils/razorpayUtils');

            // 1. Get or Create Razorpay Plan
            const planId = await getOrCreatePlan(amount);

            // 2. Create Razorpay Subscription
            const razorpaySubscription = await razorpay.subscriptions.create({
                plan_id: planId,
                total_count: 60, // 5 years max, or whatever your business logic dictates
                quantity: 1,
                customer_notify: 1,
                // Add metadata for webhook tracking
                notes: {
                    donorMobile,
                    motivatorMobile: isSelfReferral ? '' : (finalMotivatorMobile || '')
                }
            });

            // 3. Store in DB as 'created' (waiting for first payment)
            const subscription = await Subscription.create({
                amount,
                donorName,
                donorMobile,
                donorEmail,
                motivatorMobile: isSelfReferral ? null : finalMotivatorMobile,
                level1UserId: isSelfReferral ? null : level1UserId,
                level2UserId: isSelfReferral ? null : level2UserId,
                status: 'created',
                is80G: !!(panNumber && panNumber.trim().length > 0),
                panNumber,
                aadhaarNumber,
                address,
                city,
                state,
                planId: planId,
                subscriptionId: razorpaySubscription.id,
                totalCycles: 60,
                donorUserId: req.user ? req.user._id : null
            });

            // Check if user is already registered to return to frontend
            const existingUser = await User.findOne({ mobile: donorMobile });
            const isAlreadyRegistered = !!(existingUser && existingUser.password);

            return res.status(201).json({
                success: true,
                message: 'Monthly Subscription Initiated',
                subscriptionId: razorpaySubscription.id,
                amount: Math.round(amount * 100),
                currency: 'INR',
                donorName,
                donorEmail,
                donorMobile,
                isAlreadyRegistered
            });
        }

        // 1. One-time Donation Logic (Create Pending Donation)
        const donation = await Donation.create({
            amount,
            donorName,
            donorMobile,
            donorEmail,
            motivatorMobile: isSelfReferral ? null : finalMotivatorMobile,
            referralSource,
            panNumber,
            aadhaarNumber,
            address,
            city,
            state,
            status: 'pending',
            level1UserId: isSelfReferral ? null : level1UserId,
            level2UserId: isSelfReferral ? null : level2UserId,
            is80G: !!(panNumber && panNumber.trim().length > 0)
        });

        // 2. CREATE RAZORPAY ORDER
        const transaction_id = 'TXN_' + crypto.randomBytes(10).toString('hex').toUpperCase();
        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: transaction_id,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Update donation with orderId
        donation.orderId = razorpayOrder.id;
        await donation.save();

        // Also create a record in Payment model for tracking
        const Payment = require('../models/Payment');
        await Payment.create({
            userId: level1UserId || null, // Optional if we have a userId
            amount,
            currency: 'INR',
            transaction_id,
            order_id: razorpayOrder.id,
            status: 'created',
            email: donorEmail,
            contact: donorMobile
        });

        // Check if user is already registered to return to frontend
        const existingUser = await User.findOne({ mobile: donorMobile });
        const isAlreadyRegistered = !!(existingUser && existingUser.password);

        res.status(201).json({
            success: true,
            message: 'Donation Order Created',
            donationId: donation._id,
            order_id: razorpayOrder.id,
            amount: options.amount,
            currency: options.currency,
            donorName,
            donorEmail,
            donorMobile,
            isAlreadyRegistered
        });
        
        return; // Important: exit here, don't run mock success logic below

        // 5. PROCESS COMMISSION 
        if (level1UserId && !isSelfReferral) {
            console.log(`[ROUTE] Triggering commission for Donation: ${donation._id}, Motivator: ${level1UserId}`);
            await processDonationCommission(amount, motivatorMobile, donation._id, donorName, donorMobile, level1UserId);
        } else {
            console.log(`[ROUTE] Skipping commission: level1UserId=${level1UserId}, isSelfReferral=${isSelfReferral}`);
        }

        // 4. Create Notification
        const io = req.app.get('io');
        const notification = await Notification.create({
            type: 'DONATION',
            message: `New donation of ₹${amount} from ${donorName}`,
            referenceId: donation._id,
            onModel: 'Donation',
            isRead: false
        });

        if (io) {
            io.to('admin_notifications').emit('new_donation', notification);
        }

        // 6. Send WhatsApp Notification
        await whatsappService.sendDonationNotification(donorMobile, donorName, amount, donation._id);

        // 7. Send Email Notification if available
        if (donorEmail) {
            await whatsappService.sendDonationEmail(donorEmail, donorName, amount, donation._id);
        }

        // 8. Sync info to User Profile for auto-fill next time
        let donorUser = null;
        try {
            donorUser = await User.findOne({ mobile: donorMobile });
            if (donorUser) {
                donorUser.email = donorEmail || donorUser.email;
                donorUser.address = address || donorUser.address;
                donorUser.city = city || donorUser.city;
                donorUser.state = state || donorUser.state;
                donorUser.lastMotivatorMobile = donorUser.lastMotivatorMobile || finalMotivatorMobile;
            } else {
                donorUser = new User({
                    name: donorName,
                    mobile: donorMobile,
                    email: donorEmail || undefined,
                    address,
                    city,
                    state,
                    lastMotivatorMobile: finalMotivatorMobile
                });
            }
            await donorUser.save(); // Triggers pre('save') for referralCode
        } catch (err) {
            console.error("User Profile Sync Failed:", err);
        }

        res.status(201).json({
            message: 'Donation Successful',
            donationId: donation._id,
            isAlreadyRegistered: !!(donorUser && donorUser.password)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Send OTP for Wallet Donation
// @route   POST /api/donate/wallet/send-otp
router.post('/wallet/send-otp', protect, async (req, res) => {
    const whatsappService = require('../services/whatsappService');
    const User = require('../models/User');

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        const success = await whatsappService.sendWalletDonationOTP(user.mobile, otp);

        if (success) {
            res.json({ 
                success: true, 
                message: 'OTP sent successfully to your WhatsApp' 
            });
        } else {
            res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
        }
    } catch (error) {
        console.error("Wallet OTP Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Donate using Wallet Balance
// @route   POST /api/donate/wallet
router.post('/wallet', protect, async (req, res) => {
    const mongoose = require('mongoose');
    const Wallet = require('../models/Wallet');
    const Transaction = require('../models/Transaction');
    const Donation = require('../models/Donation');
    const Notification = require('../models/Notification');
    const User = require('../models/User');
    const whatsappService = require('../services/whatsappService');
    const crypto = require('crypto');

    const { amount, donorName, donorEmail, donorMobile, panNumber, aadhaarNumber, address, city, state, otp } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    if (!otp) {
        return res.status(400).json({ message: 'OTP is required' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Verify OTP
        const user = await User.findById(req.user._id).session(session);
        if (!user || !user.otp || user.otp !== otp || user.otpExpires < new Date()) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // 2. Get Wallet
        const wallet = await Wallet.findOne({ user: req.user._id }).session(session);
        if (!wallet || wallet.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        // 3. Create Donation Record (Success immediately)
        const donationId = 'WAL_' + crypto.randomBytes(8).toString('hex').toUpperCase();
        const donationArr = await Donation.create([{
            amount,
            donorName: donorName || req.user.name,
            donorMobile: donorMobile || req.user.mobile,
            donorEmail: donorEmail || req.user.email,
            panNumber,
            aadhaarNumber,
            address,
            city,
            state,
            status: 'success',
            paymentMethod: 'wallet',
            transactionId: donationId,
            receiptNumber: donationId,
            is80G: !!(panNumber && panNumber.trim().length > 0)
        }], { session });

        const newDonation = donationArr[0];

        // 4. Deduct from Wallet
        wallet.balance -= amount;
        await wallet.save({ session });

        // 5. Create Wallet Transaction Record
        await Transaction.create([{
            wallet: wallet._id,
            amount,
            type: 'debit',
            reason: 'wallet_donation',
            referenceId: newDonation._id,
            description: `Donated ₹${amount} to Foundation from Wallet`
        }], { session });

        // 6. Clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        // --- Post-transaction tasks (Async) ---
        
        // Notification
        try {
            const io = req.app.get('io');
            const notification = await Notification.create({
                type: 'DONATION',
                message: `New wallet donation of ₹${amount} from ${newDonation.donorName}`,
                referenceId: newDonation._id,
                onModel: 'Donation',
                isRead: false
            });
            if (io) io.to('admin_notifications').emit('new_donation', notification);
        } catch (e) { console.error("Notification error:", e); }

        // WhatsApp
        try {
            await whatsappService.sendWalletDonationNotification(newDonation.donorMobile, newDonation.donorName, amount, newDonation._id);
        } catch (e) { console.error("WhatsApp error:", e); }

        res.status(201).json({
            success: true,
            message: 'Donation successful using wallet balance',
            donationId: newDonation._id
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        console.error("Wallet donation error:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Previous Motivator for a mobile number (Auto-fill)
// @route   GET /api/donate/previous-motivator/:mobile
router.get('/previous-motivator/:mobile', async (req, res) => {
    try {
        const { mobile } = req.params;
        // Search in both Donations and Subscriptions for the latest entry with a motivator
        const [lastDonation, lastSubscription] = await Promise.all([
            Donation.findOne({ donorMobile: mobile, motivatorMobile: { $exists: true, $ne: null, $ne: "" } }).sort({ createdAt: -1 }),
            require('../models/Subscription').findOne({ donorMobile: mobile, motivatorMobile: { $exists: true, $ne: null, $ne: "" } }).sort({ createdAt: -1 })
        ]);

        let latest = null;
        if (lastDonation && lastSubscription) {
            latest = lastDonation.createdAt > lastSubscription.createdAt ? lastDonation : lastSubscription;
        } else {
            latest = lastDonation || lastSubscription;
        }

        if (latest && latest.motivatorMobile) {
            // Find motivator name for better UX
            const motivator = await User.findOne({
                $or: [
                    { mobile: latest.motivatorMobile },
                    { referralCode: latest.motivatorMobile.toUpperCase() }
                ]
            });

            return res.json({
                motivatorMobile: latest.motivatorMobile,
                motivatorName: motivator ? motivator.name : ''
            });
        }

        res.json({ message: 'No previous motivator found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Validate Motivator Mobile or Code
router.get('/validate-motivator/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const { currentMobile } = req.query;

        const query = identifier.length >= 10 
            ? { mobile: identifier } 
            : { referralCode: identifier.toUpperCase() };

        const user = await User.findOne(query).populate('referredBy', 'mobile');
        if (user) {
            // Check for circular reference
            if (currentMobile && user.referredBy && user.referredBy.mobile === currentMobile) {
                return res.json({ 
                    valid: false, 
                    message: 'Circular Relationship: This user has already selected you as their motivator.' 
                });
            }

            res.json({ valid: true, name: user.name, mobile: user.mobile, code: user.referralCode });
        } else {
            res.json({ valid: false, message: 'Motivator not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Traffic Analytics
// @route   GET /api/donate/analytics/traffic-sources
router.get('/analytics/traffic-sources', async (req, res) => {
    try {
        const donations = await Donation.find({ status: 'success' }); // Only count successful donations

        let stats = {
            referral: 0,
            instagram: 0,
            facebook: 0,
            whatsapp: 0,
            website: 0,
            other: 0
        };

        donations.forEach(d => {
            // Logic: 
            // 1. If Motivator exists -> Referral
            // 2. Else check Referral Source

            const source = (d.referralSource || '').toLowerCase();

            if (source.includes('instagram')) stats.instagram++;
            else if (source.includes('facebook')) stats.facebook++;
            else if (source.includes('whatsapp')) stats.whatsapp++;
            else if (source.includes('website')) stats.website++;
            else if (d.motivatorMobile && d.motivatorMobile.length >= 10) {
                stats.referral++;
            } else {
                stats.other++; // Direct/Other
            }
        });

        // Format for Recharts
        const pieData = [
            { name: 'Referral', value: stats.referral },
            { name: 'Instagram', value: stats.instagram },
            { name: 'Facebook', value: stats.facebook },
            { name: 'WhatsApp', value: stats.whatsapp },
            { name: 'Website', value: stats.website },
            { name: 'Direct/Other', value: stats.other }
        ].map(item => ({
            ...item,
            // If value 0, set tiny value for visibility? Or frontend handles it?
            // User requested: "do not hide it. Just show it smaller or lighter".
            // Recharts behaves better with 0 if we handle it on frontend or give small epsilon.
            // But USER said "percentage list", so we need true values.
            // Let's send true values, frontend will handle visualization.
            value: item.value
        }));

        // Calculate total for percentages
        const total = donations.length;
        const responseData = {
            data: pieData,
            total: total
        };

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Leaderboard Data
// @route   GET /api/donate/leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const { period = 'all-time' } = req.query;
        let match = { status: 'success' };

        const now = new Date();
        if (period === 'today') {
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            match.createdAt = { $gte: startOfDay };
        } else if (period === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            match.createdAt = { $gte: startOfWeek };
        } else if (period === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            match.createdAt = { $gte: startOfMonth };
        }

        // Fetch limit from settings
        const limitSetting = await Setting.findOne({ key: 'leaderboard_limit' });
        const limit = limitSetting ? Number(limitSetting.value) : 10;

        const leaderboard = await Donation.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$donorMobile",
                    name: { $last: "$donorName" }, // Use the latest name provided by this mobile
                    totalAmount: { $sum: "$amount" }
                }
            },
            { $sort: { totalAmount: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    totalAmount: 1,
                    mobile: "$_id"
                }
            }
        ]);

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update Tax Info & Regenerate Certificate (Admin)
// @route   PUT /api/donate/update-tax-info/:id
router.put('/update-tax-info/:id', async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: 'Donation not found' });

        const { panNumber, aadhaarNumber } = req.body;
        donation.panNumber = panNumber;
        donation.aadhaarNumber = aadhaarNumber;
        donation.is80G = !!(panNumber && panNumber.trim().length > 0);
        
        await donation.save();
        res.json({ message: 'Tax information updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Regenerate Certificate (Admin)
// @route   POST /api/donate/regenerate-certificate/:id
router.post('/regenerate-certificate/:id', async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: 'Donation not found' });
        // Allow regenerating receipt for any donation regardless of 80G status

        await certificateService.createCertificate(donation);
        res.json({ message: 'Certificate regenerated successfully', url: donation.certificateUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Upload 80G Certificate (Admin)
// @route   POST /api/donate/upload-80g/:id
router.post('/upload-80g/:id', protect, adminOnly, upload.single('certificate'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Please upload a PDF file' });

        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: 'Donation not found' });

        const relativePath = `/public/certificates/manual/${req.file.filename}`;
        donation.certificate80GUrl = relativePath;
        donation.is80GUploaded = true;
        await donation.save();

        // Send WhatsApp Notification
        try {
            await whatsappService.send80GCertificateNotification(
                donation.donorMobile,
                donation.donorName,
                relativePath
            );
        } catch (wsErr) {
            console.error("WhatsApp Notify Error (80G):", wsErr.message);
        }

        res.json({ 
            message: '80G Certificate uploaded and notification queued', 
            url: relativePath 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
