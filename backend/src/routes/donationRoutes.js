const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { processDonationCommission } = require('../services/commissionService');

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

        const donations = await Donation.find(filter).sort({ createdAt: -1 });
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
        aadhaarNumber
    } = req.body;

    // Validation
    if (!amount || !donorName || !donorMobile) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // 1. Create Donation Record (Pending)
        const donation = await Donation.create({
            amount,
            donorName,
            donorMobile,
            donorEmail,
            motivatorMobile,
            referralSource,
            panNumber,
            aadhaarNumber,
            status: 'pending'
        });



        // 2. MOCK PAYMENT SUCCESS
        // mostly here we'd initiate gateway. For now, immediate success.

        donation.status = 'success';
        donation.transactionId = `MOCK_TXN_${Date.now()}`;
        await donation.save();

        // 3. Trigger Commission Logic
        if (motivatorMobile) {
            // Run async, don't block response? Or await?
            // Safer to await to ensure data integrity during test, but usually async background job.
            await processDonationCommission(amount, motivatorMobile, donation._id, donorName, donorMobile);
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

        res.status(201).json({
            message: 'Donation Successful',
            donationId: donation._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc Validate Motivator Mobile
router.get('/validate-motivator/:mobile', async (req, res) => {
    try {
        const user = await User.findOne({ mobile: req.params.mobile });
        if (user) {
            res.json({ valid: true, name: user.name });
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

            if (d.motivatorMobile && d.motivatorMobile.length >= 10) {
                stats.referral++;
            } else {
                const source = (d.referralSource || '').toLowerCase();
                if (source.includes('instagram')) stats.instagram++;
                else if (source.includes('facebook')) stats.facebook++;
                else if (source.includes('whatsapp')) stats.whatsapp++;
                else if (source.includes('website')) stats.website++;
                else stats.other++; // Direct/Other
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

module.exports = router;
