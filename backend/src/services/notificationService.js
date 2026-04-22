/**
 * Centralized Notification Service
 * Handles In-app, Email (Nodemailer), and SMS (Placeholder)
 */
const Notification = require('../models/Notification');
const whatsappService = require('./whatsappService');

class NotificationService {

    /**
     * Send notification to a specific user or admin
     */
    async notify({ userId, type, message, referenceId, onModel, email, sms, whatsapp }) {
        try {
            // 1. Create In-App Notification (Database)
            const notification = await Notification.create({
                user: userId || null, // null for admin
                type,
                message,
                referenceId,
                onModel,
                isRead: false
            });

            // 2. Send Email (Mocked for now, ready for Nodemailer)
            if (email) {
                console.log(`[EMAIL SENDING] To: ${email} | Subject: ${type} | Body: ${message}`);
            }

            // 3. Send SMS (Mocked for now, ready for Twilio/MSG91)
            if (sms) {
                console.log(`[SMS SENDING] To: ${sms} | Msg: ${message}`);
            }

            // 4. Send WhatsApp (Using whatsapp_service_backend)
            if (whatsapp) {
                console.log(`[WHATSAPP SENDING] To: ${whatsapp} | Msg: ${message}`);
                await whatsappService.sendMessage(whatsapp, message);
            }

            return notification;
        } catch (error) {
            console.error("Notification Service Error:", error);
        }
    }

    /**
     * Specialized: New Donation Alert for Motivator
     */
    async notifyMotivatorDonation(motivator, amount, donorName, level = 1) {
        const commission = level === 1 ? amount * 0.1 : amount * 0.03;
        const msg = level === 1 
            ? `Congratulations! You earned ₹${commission.toFixed(2)} commission from ${donorName}'s donation.`
            : `Level 2 Bonus! You earned ₹${commission.toFixed(2)} from ${donorName} (via your network).`;

        await this.notify({
            userId: motivator._id,
            type: 'COMMISSION_EARNED',
            message: msg,
            email: motivator.email,
            sms: motivator.mobile
        });
    }

    /**
     * Specialized: Subscription Stopped Alert for Motivator
     */
    async notifySubscriptionStopped(motivator, donorName, donorMobile) {
        const msg = `⚠️ Important: ${donorName} (${donorMobile}) has stopped their monthly donation. You will no longer receive commission from this donor.`;
        
        await this.notify({
            userId: motivator._id,
            type: 'SUBSCRIPTION_STOPPED',
            message: msg,
            email: motivator.email,
            sms: motivator.mobile
        });
    }

    /**
     * Specialized: Payout Requested Alert for Admin
     */
    async notifyPayoutRequested(payoutRequest, user) {
        const msg = `🔔 Payout Request: ₹${payoutRequest.amount} requested by ${user.name} (${user.mobile})`;
        
        return await this.notify({
            userId: null, // For admins
            type: 'PAYOUT',
            message: msg,
            referenceId: payoutRequest._id,
            onModel: 'PayoutRequest'
        });
    }

    /**
     * Specialized: Payout Processed Alert for User
     */
    async notifyPayoutProcessed(payoutRequest, status) {
        const msg = status === 'completed'
            ? `✅ Your payout request of ₹${payoutRequest.amount} has been processed successfully.`
            : `❌ Your payout request of ₹${payoutRequest.amount} was rejected. Note: ${payoutRequest.adminNotes || 'Contact support'}`;
        
        return await this.notify({
            userId: payoutRequest.user,
            type: 'PAYOUT',
            message: msg,
            referenceId: payoutRequest._id,
            onModel: 'PayoutRequest'
        });
    }
}

module.exports = new NotificationService();
