const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Setting = require('../models/Setting');

const processDonationCommission = async (donationAmount, motivatorMobile, donationId, donorName, donorMobile) => {
    if (!motivatorMobile) return;

    try {
        // 1. Find Level 1 Motivator
        const motivator = await User.findOne({ mobile: motivatorMobile });
        if (!motivator) return;

        // Get Global Commission Rates
        // In a real app, fetch from DB. For now, defaulting if not found.
        const l1Rate = await Setting.findOne({ key: 'commission_level_1' });
        const l2Rate = await Setting.findOne({ key: 'commission_level_2' });

        const rate1 = l1Rate ? l1Rate.value : 10;
        const rate2 = l2Rate ? l2Rate.value : 3;

        // --- LEVEL 1 COMMISSION ---
        const comm1 = (donationAmount * rate1) / 100;

        let wallet1 = await Wallet.findOne({ user: motivator._id });
        if (!wallet1) {
            wallet1 = await Wallet.create({ user: motivator._id });
        }

        wallet1.balance += comm1;
        wallet1.totalEarned += comm1;
        await wallet1.save();

        await Transaction.create({
            wallet: wallet1._id,
            amount: comm1,
            type: 'credit',
            reason: 'referral_commission_l1',
            referenceId: donationId,
            description: `10% Commission for donation from ${donorName} (${donorMobile})`
        });

        console.log(`L1 Commission: ${comm1} credited to ${motivator.name}`);

        // --- LEVEL 2 COMMISSION ---
        // "This commission will be given to the motivator of the Level 1 motivator"
        // Check who referred the Level 1 motivator
        if (motivator.referredBy) {
            const grandMotivator = await User.findById(motivator.referredBy);

            if (grandMotivator) {
                const comm2 = (donationAmount * rate2) / 100;

                let wallet2 = await Wallet.findOne({ user: grandMotivator._id });
                if (!wallet2) {
                    wallet2 = await Wallet.create({ user: grandMotivator._id });
                }

                wallet2.balance += comm2;
                wallet2.totalEarned += comm2;
                await wallet2.save();

                await Transaction.create({
                    wallet: wallet2._id,
                    amount: comm2,
                    type: 'credit',
                    reason: 'referral_commission_l2',
                    referenceId: donationId,
                    description: `3% L2 Commission via ${motivator.name} for donation from ${donorName} (${donorMobile})`
                });

                console.log(`L2 Commission: ${comm2} credited to ${grandMotivator.name}`);
            }
        }

    } catch (error) {
        console.error("Error processing commission:", error);
    }
};

module.exports = { processDonationCommission };
