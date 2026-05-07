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

        // 4. Create a Donation Record for this month's charge
        const donation = await Donation.create({
            amount: amount,
            donorName: subscription.donorName,
            donorMobile: subscription.donorMobile,
            donorEmail: subscription.donorEmail,
            motivatorMobile: subscription.motivatorMobile,
            level1UserId: subscription.level1UserId,
            level2UserId: subscription.level2UserId,
            status: 'success',
            transactionId: paymentId,
            orderId: paymentEntity.order_id,
            is80G: subscription.is80G,
            panNumber: subscription.panNumber,
            aadhaarNumber: subscription.aadhaarNumber,
            address: subscription.address,
            city: subscription.city,
            state: subscription.state
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
            } else {
                donorUser = new User({
                    name: subscription.donorName,
                    mobile: subscription.donorMobile,
                    email: subscription.donorEmail || undefined,
                    address: subscription.address,
                    city: subscription.city,
                    state: subscription.state,
                    lastMotivatorMobile: subscription.motivatorMobile
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
 * Handle Subscription Status Update (Paused, Resumed, etc.)
 */
const handleSubscriptionStatusUpdate = async (subscriptionId, status) => {
    try {
        const subscription = await Subscription.findOne({ subscriptionId });
        if (subscription) {
            subscription.status = status;
            await subscription.save();
            console.log(`Subscription ${subscriptionId} status updated to: ${status}`);
        }
    } catch (error) {
        console.error('Error updating subscription status:', error);
    }
};

/**
 * Handle Subscription Cancellation
 */
const handleSubscriptionCancelled = async (subscriptionId) => {
    return handleSubscriptionStatusUpdate(subscriptionId, 'cancelled');
};

module.exports = {
    handleSubscriptionCharged,
    handleSubscriptionCancelled,
    handleSubscriptionStatusUpdate
};
