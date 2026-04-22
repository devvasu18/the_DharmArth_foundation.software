const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { processDonationCommission } = require('../services/commissionService');
const certificateService = require('../services/certificateService');
const whatsappService = require('../services/whatsappService');
const { protect } = require('../middlewares/authMiddleware');

// @desc    Get All Donations (Admin)
// @route   GET /api/donate
router.get('/', async (req, res) => {
    // Ideally check permission
    try {
        const { month, year } = req.query;
        let filter = {};

        if (month && year) {
            // month is 1-indexed in query, but 0-indexed in JS Date
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            filter.createdAt = {
                $gte: startDate,
                $lte: endDate
            };
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

// @desc    Initiate Donation (Mock Payment)
// @route   POST /api/donate
router.post('/', async (req, res) => {
    const {
        amount,
        donorName,
        donorMobile,
        donorEmail,
        motivatorMobile,
        referralSource,
        panNumber,
        aadhaarNumber,
        address,
        city,
        state
    } = req.body;

    // Validation
    if (!amount || !donorName || !donorMobile) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const { donationType = 'one-time' } = req.body;

        // Prepare Commission Fields
        let level1UserId = null;
        let level2UserId = null;

        if (motivatorMobile) {
            const motivator = await User.findOne({
                $or: [
                    { mobile: motivatorMobile },
                    { referralCode: motivatorMobile.toUpperCase() }
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
        const isSelfReferral = donorMobile === motivatorMobile || 
                             (level1UserId && level1UserId.toString() === donorMobile);

        if (donationType === 'monthly') {
            const Subscription = require('../models/Subscription');
            const subscription = await Subscription.create({
                amount,
                donorName,
                donorMobile,
                donorEmail,
                motivatorMobile: isSelfReferral ? null : motivatorMobile,
                level1UserId: isSelfReferral ? null : level1UserId,
                level2UserId: isSelfReferral ? null : level2UserId,
                status: 'active',
                is80G: !!(panNumber && panNumber.trim().length > 0),
                panNumber,
                aadhaarNumber,
                address,
                city,
                state,
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });

            // For subscriptions, we also create the FIRST donation record immediately
            const donation = await Donation.create({
                amount,
                donorName,
                donorMobile,
                donorEmail,
                motivatorMobile: isSelfReferral ? null : motivatorMobile,
                status: 'success',
                transactionId: `MOCK_SUB_FIRST_${Date.now()}`,
                level1UserId: isSelfReferral ? null : level1UserId,
                level2UserId: isSelfReferral ? null : level2UserId,
                is80G: !!(panNumber && panNumber.trim().length > 0),
                panNumber,
                aadhaarNumber,
                address,
                city,
                state
            });

            // Handle commission and certificates for first payment
            if (level1UserId && !isSelfReferral) {
                await processDonationCommission(amount, motivatorMobile, donation._id, donorName, donorMobile, level1UserId);
            }
            if (donation.is80G) await certificateService.createCertificate(donation);

            // 5. Send WhatsApp Notification
            await whatsappService.sendDonationNotification(donorMobile, donorName, amount);

            // 6. Send Email Notification if available
            if (donorEmail) {
                await whatsappService.sendDonationEmail(donorEmail, donorName, amount);
            }
            
            // 7. Sync info to User Profile (Update even if not logged in, identified by mobile)
            try {
                let user = await User.findOne({ mobile: donorMobile });
                if (user) {
                    user.email = donorEmail || user.email;
                    user.address = address || user.address;
                    user.city = city || user.city;
                    user.state = state || user.state;
                    user.lastMotivatorMobile = motivatorMobile || user.lastMotivatorMobile;
                } else {
                    user = new User({
                        name: donorName,
                        mobile: donorMobile,
                        email: donorEmail || undefined,
                        address,
                        city,
                        state,
                        lastMotivatorMobile: motivatorMobile
                    });
                }
                await user.save(); // Triggers pre('save') for referralCode
            } catch (err) {
                console.error("User Profile Sync (Monthly) Failed:", err);
            }

            return res.status(201).json({
                message: 'Subscription Started Successfully',
                subscriptionId: subscription._id,
                donationId: donation._id
            });
        }

        // 1. One-time Donation Logic (Existing)
        const donation = await Donation.create({
            amount,
            donorName,
            donorMobile,
            donorEmail,
            motivatorMobile: isSelfReferral ? null : motivatorMobile,
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

        // 2. MOCK PAYMENT SUCCESS
        donation.status = 'success';
        donation.transactionId = `MOCK_TXN_${Date.now()}`;
        
        // 4. Generate 80G Certificate if applicable
        if (donation.is80G) {
            try {
                await certificateService.createCertificate(donation);
            } catch (err) {
                console.error("Certificate Generation Failed:", err);
            }
        }

        await donation.save();

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
        await whatsappService.sendDonationNotification(donorMobile, donorName, amount);

        // 7. Send Email Notification if available
        if (donorEmail) {
            await whatsappService.sendDonationEmail(donorEmail, donorName, amount);
        }

        // 8. Sync info to User Profile for auto-fill next time
        try {
            let user = await User.findOne({ mobile: donorMobile });
            if (user) {
                user.email = donorEmail || user.email;
                user.address = address || user.address;
                user.city = city || user.city;
                user.state = state || user.state;
                user.lastMotivatorMobile = motivatorMobile || user.lastMotivatorMobile;
            } else {
                user = new User({
                    name: donorName,
                    mobile: donorMobile,
                    email: donorEmail || undefined,
                    address,
                    city,
                    state,
                    lastMotivatorMobile: motivatorMobile
                });
            }
            await user.save(); // Triggers pre('save') for referralCode
        } catch (err) {
            console.error("User Profile Sync Failed:", err);
        }

        res.status(201).json({
            message: 'Donation Successful',
            donationId: donation._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc Validate Motivator Mobile or Code
router.get('/validate-motivator/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const query = identifier.length >= 10 
            ? { mobile: identifier } 
            : { referralCode: identifier.toUpperCase() };

        const user = await User.findOne(query);
        if (user) {
            res.json({ valid: true, name: user.name, mobile: user.mobile, code: user.referralCode });
        } else {
            res.json({ valid: false });
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
        if (!donation.is80G) return res.status(400).json({ message: 'This donation does not require 80G' });

        await certificateService.createCertificate(donation);
        res.json({ message: 'Certificate regenerated successfully', url: donation.certificateUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
