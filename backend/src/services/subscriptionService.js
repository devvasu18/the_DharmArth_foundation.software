const Subscription = require('../models/Subscription');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { processDonationCommission } = require('../services/commissionService');
const certificateService = require('../services/certificateService');
const whatsappService = require('../services/whatsappService');

/**
 * Handle Subscription Charging (Every Month)
 * @param {string} subscriptionId - Razorpay Subscription ID
 * @param {string} paymentId - Razorpay Payment ID
 * @param {object} payload - Full webhook payload for details
 */
const handleSubscriptionCharged = async (subscriptionId, paymentId, payload, io) => {
    try {
        // 1. Find the Subscription in our DB
        const subscription = await Subscription.findOne({ subscriptionId });
        if (!subscription) {
            console.error(`Subscription record not found for ID: ${subscriptionId}`);
            return;
        }

        // 2. IDEMPOTENCY CHECK
        // Check if this payment_id has already been processed for this subscription
        const existingDonation = await Donation.findOne({ transactionId: paymentId });
        if (existingDonation) {
            console.log(`Payment ${paymentId} already processed for subscription ${subscriptionId}`);
            return;
        }

        // 3. Extract Payment Details from Webhook
        const paymentEntity = payload.payment.entity;
        let amount = paymentEntity.amount / 100; // Convert from paise

        // If amount is 0 (from verification dummy), use subscription stored amount
        if (amount === 0) {
            amount = subscription.amount;
        }

        // Auto-resolve level2UserId if missing on subscription
        let finalLevel2UserId = subscription.level2UserId;
        if (!finalLevel2UserId && subscription.level1UserId) {
            try {
                const l1 = await User.findById(subscription.level1UserId);
                if (l1) {
                    if (l1.referredBy) {
                        finalLevel2UserId = l1.referredBy;
                    } else if (l1.lastMotivatorMobile) {
                        const grand = await User.findOne({
                            $or: [
                                { mobile: l1.lastMotivatorMobile },
                                { referralCode: String(l1.lastMotivatorMobile).toUpperCase() }
                            ]
                        });
                        if (grand) {
                            finalLevel2UserId = grand._id;
                            await User.updateOne({ _id: l1._id }, { $set: { referredBy: grand._id } });
                        }
                    }
                    if (finalLevel2UserId) {
                        subscription.level2UserId = finalLevel2UserId;
                        await Subscription.updateOne({ _id: subscription._id }, { $set: { level2UserId: finalLevel2UserId } });
                    }
                }
            } catch (err) {
                console.error('Error resolving level2UserId on subscription charge:', err);
            }
        }

        // 4. Create a Donation Record for this month's charge
        const donation = await Donation.create({
            amount: amount,
            donorName: subscription.donorName,
            donorMobile: subscription.donorMobile,
            donorEmail: subscription.donorEmail,
            motivatorMobile: subscription.motivatorMobile,
            level1UserId: subscription.level1UserId,
            level2UserId: finalLevel2UserId || subscription.level2UserId,
            status: 'success',
            transactionId: paymentId,
            orderId: paymentEntity.order_id,
            is80G: subscription.is80G,
            panNumber: subscription.panNumber,
            aadhaarNumber: subscription.aadhaarNumber,
            address: subscription.address,
            city: subscription.city,
            state: subscription.state,
            referralSource: subscription.referralSource
        });

        // 5. Update Subscription Metadata
        subscription.status = 'active';
        subscription.lastPaymentDate = new Date();
        subscription.lastPaymentId = paymentId;
        subscription.currentCycle += 1;
        
        // If it's the first payment, Razorpay usually sets next_at
        if (payload.subscription && payload.subscription.entity.next_at) {
            subscription.nextBillingDate = new Date(payload.subscription.entity.next_at * 1000);
        }

        await subscription.save();

        // 6. Trigger Commission Logic
        if (subscription.level1UserId) {
            await processDonationCommission(
                amount, 
                subscription.motivatorMobile, 
                donation._id, 
                subscription.donorName, 
                subscription.donorMobile, 
                subscription.level1UserId
            );
        }

        // 7. Generate Receipt
        try {
            await certificateService.createCertificate(donation);
        } catch (err) {
            console.error("Subscription Receipt Failed:", err);
        }

        // 8. Notifications
        await whatsappService.sendDonationNotification(subscription.donorMobile, subscription.donorName, amount, donation._id);
        
        // Notify Admin via Socket.io
        if (io) {
            const Notification = require('../models/Notification');
            const notif = await Notification.create({
                type: 'DONATION',
                message: `Recurring donation of ₹${amount} from ${subscription.donorName}`,
                referenceId: donation._id,
                onModel: 'Donation'
            });
            io.to('admin_notifications').emit('new_donation', notif);
        }

        // 9. Sync User Profile
        try {
            let donorUser = await User.findOne({ mobile: subscription.donorMobile });
            if (donorUser) {
                donorUser.email = subscription.donorEmail || donorUser.email;
                donorUser.address = subscription.address || donorUser.address;
                donorUser.city = subscription.city || donorUser.city;
                donorUser.state = subscription.state || donorUser.state;
                donorUser.lastMotivatorMobile = donorUser.lastMotivatorMobile || subscription.motivatorMobile;
                if (!donorUser.referredBy && subscription.level1UserId) {
                    donorUser.referredBy = subscription.level1UserId;
                }
            } else {
                donorUser = new User({
                    name: subscription.donorName,
                    mobile: subscription.donorMobile,
                    email: subscription.donorEmail || undefined,
                    address: subscription.address,
                    city: subscription.city,
                    state: subscription.state,
                    lastMotivatorMobile: subscription.motivatorMobile,
                    referredBy: subscription.level1UserId || undefined
                });
            }
            await donorUser.save();
        } catch (err) {
            console.error("User Profile Sync Failed (Subscription):", err);
        }

        console.log(`Subscription ${subscriptionId} charged successfully. Cycle: ${subscription.currentCycle}`);

    } catch (error) {
        console.error('Error handling subscription charge:', error);
    }
};

/**
 * Notify Admin and Motivators when a subscription is cancelled
 */
const notifySubscriptionCancellation = async (subscription, io = null) => {
    try {
        const notificationService = require('./notificationService');

        // 1. Notify Admin
        await notificationService.notifySubscriptionCancelledAdmin(subscription, io).catch(err =>
            console.error('Error sending cancellation notification to admin:', err)
        );

        // 2. Notify Motivators
        let l1User = null;
        if (subscription.level1UserId) {
            l1User = await User.findById(subscription.level1UserId);
        } else if (subscription.motivatorMobile) {
            l1User = await User.findOne({
                $or: [
                    { mobile: subscription.motivatorMobile },
                    { referralCode: String(subscription.motivatorMobile).toUpperCase() }
                ]
            });
        }

        // Fallback: Check donor user's referredBy or lastMotivatorMobile
        if (!l1User) {
            const donorUser = (subscription.donorUserId ? await User.findById(subscription.donorUserId) : null)
                || (subscription.donorMobile ? await User.findOne({ mobile: subscription.donorMobile }) : null);

            if (donorUser) {
                if (donorUser.referredBy) {
                    l1User = await User.findById(donorUser.referredBy);
                } else if (donorUser.lastMotivatorMobile) {
                    l1User = await User.findOne({
                        $or: [
                            { mobile: donorUser.lastMotivatorMobile },
                            { referralCode: String(donorUser.lastMotivatorMobile).toUpperCase() }
                        ]
                    });
                }
            }
        }

        if (l1User) {
            await notificationService.notifySubscriptionStopped(
                l1User,
                subscription.donorName,
                subscription.donorMobile,
                subscription.amount,
                1,
                io
            ).catch(err => console.error('Error notifying L1 motivator of cancellation:', err));
        }

        let l2User = null;
        if (subscription.level2UserId) {
            l2User = await User.findById(subscription.level2UserId);
        } else if (l1User && l1User.referredBy) {
            l2User = await User.findById(l1User.referredBy);
        }

        if (l2User && (!l1User || l2User._id.toString() !== l1User._id.toString())) {
            await notificationService.notifySubscriptionStopped(
                l2User,
                subscription.donorName,
                subscription.donorMobile,
                subscription.amount,
                2,
                io
            ).catch(err => console.error('Error notifying L2 motivator of cancellation:', err));
        }
    } catch (err) {
        console.error('Error in notifySubscriptionCancellation:', err);
    }
};

/**
 * Handle Subscription Status Update (Paused, Resumed, etc.)
 */
const handleSubscriptionStatusUpdate = async (subscriptionId, status, io = null) => {
    try {
        const subscription = await Subscription.findOne({ subscriptionId });
        if (subscription) {
            const previousStatus = subscription.status;
            subscription.status = status;
            await subscription.save();
            console.log(`Subscription ${subscriptionId} status updated to: ${status}`);

            if (status === 'cancelled' && previousStatus !== 'cancelled') {
                await notifySubscriptionCancellation(subscription, io);
            }
        }
    } catch (error) {
        console.error('Error updating subscription status:', error);
    }
};

/**
 * Handle Subscription Cancellation
 */
const handleSubscriptionCancelled = async (subscriptionId, io = null) => {
    return handleSubscriptionStatusUpdate(subscriptionId, 'cancelled', io);
};

module.exports = {
    handleSubscriptionCharged,
    handleSubscriptionCancelled,
    handleSubscriptionStatusUpdate,
    notifySubscriptionCancellation
};
