const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const User = require('../models/User');
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

module.exports = router;
