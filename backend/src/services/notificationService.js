/**
 * Centralized Notification Service
 * Handles In-app, Email (Nodemailer), and SMS (Placeholder)
 */
const Notification = require('../models/Notification');

class NotificationService {

    /**
     * Send notification to a specific user or admin
     */
    async notify({ userId, type, message, referenceId, onModel, email, sms }) {
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

            // 2. Push to Socket (Real-time UI update)
            // Note: io is usually injected or globally accessible via app settings
            // We'll trust the route to handle the immediate emit for now or 
            // the consumer of this service should have access to io.

            // 3. Send Email (Mocked for now, ready for Nodemailer)
            if (email) {
                console.log(`[EMAIL SENDING] To: ${email} | Subject: ${type} | Body: ${message}`);
                // await this.sendActualEmail(email, type, message);
            }

            // 4. Send SMS (Mocked for now, ready for Twilio/MSG91)
            if (sms) {
                console.log(`[SMS SENDING] To: ${sms} | Msg: ${message}`);
                // await this.sendActualSMS(sms, message);
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
}

module.exports = new NotificationService();
