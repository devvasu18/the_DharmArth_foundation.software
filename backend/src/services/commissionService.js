const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Setting = require('../models/Setting');
const notificationService = require('./notificationService');

const processDonationCommission = async (donationAmount, motivatorIdentifier, donationId, donorName, donorMobile, level1UserId = null) => {
    if (!motivatorIdentifier && !level1UserId) return;

    try {
        // 1. Find Level 1 Motivator
        let motivator;
        if (level1UserId) {
            motivator = await User.findById(level1UserId);
        } else {
            motivator = await User.findOne({ 
                $or: [
                    { mobile: motivatorIdentifier },
                    { referralCode: String(motivatorIdentifier).toUpperCase() }
                ]
            });
        }

        if (!motivator) return;

        // Get Global Commission Rates
        // In a real app, fetch from DB. For now, defaulting if not found.
        const l1Rate = await Setting.findOne({ key: 'commission_level_1' });
        const l2Rate = await Setting.findOne({ key: 'commission_level_2' });

        const rate1 = l1Rate ? l1Rate.value : 10;
        const rate2 = l2Rate ? l2Rate.value : 3;

        // --- LEVEL 1 COMMISSION ---
        const comm1 = Math.round((donationAmount * rate1)) / 100; // Round to 2 decimals

        // Use atomic findOneAndUpdate with upsert to prevent race conditions
        let wallet1 = await Wallet.findOneAndUpdate(
            { user: motivator._id },
            { $inc: { balance: comm1, totalEarned: comm1 } },
            { new: true, upsert: true }
        );

        await Transaction.create({
            wallet: wallet1._id,
            amount: comm1,
            type: 'credit',
            reason: 'referral_commission_l1',
            referenceId: donationId,
            description: `10% Commission for donation from ${donorName} (${donorMobile})`
        });

        console.log(`L1 Commission: ${comm1} credited to ${motivator.name}`);
        
        // Notify Motivator
        await notificationService.notifyMotivatorDonation(motivator, donationAmount, donorName, donorMobile, 1);

        // --- LEVEL 2 COMMISSION ---
        // "This commission will be given to the motivator of the Level 1 motivator"
        // Check who referred the Level 1 motivator
        if (motivator.referredBy) {
            const grandMotivator = await User.findById(motivator.referredBy);

            if (grandMotivator) {
                const comm2 = Math.round((donationAmount * rate2)) / 100; // Round to 2 decimals

                let wallet2 = await Wallet.findOneAndUpdate(
                    { user: grandMotivator._id },
                    { $inc: { balance: comm2, totalEarned: comm2 } },
                    { new: true, upsert: true }
                );

                await Transaction.create({
                    wallet: wallet2._id,
                    amount: comm2,
                    type: 'credit',
                    reason: 'referral_commission_l2',
                    referenceId: donationId,
                    description: `3% L2 Commission via ${motivator.name} for donation from ${donorName} (${donorMobile})`
                });

                console.log(`L2 Commission: ${comm2} credited to ${grandMotivator.name}`);
        
        // Notify Grand Motivator
        await notificationService.notifyMotivatorDonation(grandMotivator, donationAmount, donorName, donorMobile, 2, motivator);
            }
        }

    } catch (error) {
        console.error("Error processing commission:", error);
    }
};

module.exports = { processDonationCommission };
