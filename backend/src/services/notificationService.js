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
    async notify({ userId, type, message, referenceId, onModel, email, sms, whatsapp, io }) {
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

            // Emit Socket.io event for real-time updates
            if (io) {
                if (!userId) {
                    // To admins
                    console.log(`[SOCKET] Emitting new_prescription_request to admin_notifications`);
                    io.to('admin_notifications').emit('new_prescription_request', notification);
                } else {
                    // To specific user
                    console.log(`[SOCKET] Emitting new_notification to user_${userId}`);
                    io.to(`user_${userId}`).emit('new_notification', notification);
                }
            }

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
    async notifyMotivatorDonation(motivator, amount, donorName, donorMobile, level = 1, l1Motivator = null) {
        const commission = level === 1 ? amount * 0.1 : amount * 0.03;
        const msg = level === 1
            ? `Congratulations! You earned ₹${commission.toFixed(2)} commission from ${donorName}'s donation.`
            : `Partner-Inspired Bonus! You earned ₹${commission.toFixed(2)} from ${donorName} (via your network).`;

        // 1. Send In-App, Email, SMS (via generic notify)
        await this.notify({
            userId: motivator._id,
            type: 'COMMISSION_EARNED',
            message: msg,
            email: motivator.email,
            sms: motivator.mobile
        });

        // 2. Send Specialized WhatsApp
        if (level === 1) {
            await whatsappService.sendL1MotivatorNotification(motivator.mobile, {
                motivatorName: motivator.name,
                commission: commission.toFixed(2),
                donationAmount: amount,
                donorName,
                donorMobile
            });
        } else if (level === 2 && l1Motivator) {
            await whatsappService.sendL2MotivatorNotification(motivator.mobile, {
                motivatorName: motivator.name,
                commission: commission.toFixed(2),
                donationAmount: amount,
                donorName,
                donorMobile,
                l1MotivatorName: l1Motivator.name,
                l1MotivatorMobile: l1Motivator.mobile
            });
        }
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

    /**
     * Specialized: Subscription Cancelled Alert for Admin
     */
    async notifySubscriptionCancelledAdmin(subscription) {
        const msg = `🛑 Subscription Cancelled: ${subscription.donorName} (${subscription.donorMobile}) has cancelled their monthly donation of ₹${subscription.amount}.`;

        return await this.notify({
            userId: null, // For admins
            type: 'SUBSCRIPTION_CANCELLED',
            message: msg,
            referenceId: subscription._id,
            onModel: 'Subscription',
        });
    }

    /**
     * Specialized: New Prescription Uploaded Alert for Admin
     */
    async notifyPrescriptionUploadedAdmin(prescription, user, io) {
        const msg = `📄 New Prescription: Verification requested by ${user.name} (${user.mobile})`;

        return await this.notify({
            userId: null, // For admins
            type: 'PRESCRIPTION_UPLOADED',
            message: msg,
            referenceId: prescription._id,
            onModel: 'Prescription',
        });
    }

    /**
     * Specialized: Prescription Verified Alert for User
     */
    async notifyPrescriptionVerifiedUser(prescription, user, io) {
        const checkoutUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/${prescription._id}`;
        const msg = `✅ Your prescription has been verified! You can now proceed to checkout and order your medicines here: ${checkoutUrl}`;

        return await this.notify({
            userId: user._id,
            type: 'PRESCRIPTION_VERIFIED',
            message: msg,
            referenceId: prescription._id,
            onModel: 'Prescription',
            whatsapp: user.mobile,
            io
        });
    }
}

module.exports = new NotificationService();
