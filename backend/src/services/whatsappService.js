/**
 * WhatsApp Service
 * Handles communication with the external whatsapp_service_backend
 */

class WhatsappService {
    constructor() {
        this.baseUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3000';
    }

    /**
     * Send a general message via WhatsApp service
     * @param {string} number - Recipient mobile number
     * @param {string} message - Message content
     */
    async sendMessage(number, message) {
        try {
            console.log(`[WHATSAPP] Sending message to ${number}...`);

            // Basic number cleaning (remove non-digits if necessary, but assume user enters correctly)
            // The WhatsApp service backend likely handles format, but we ensure it's a string.
            const cleanNumber = String(number).replace(/\D/g, '');

            const response = await fetch(`${this.baseUrl}/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.WHATSAPP_SERVICE_API_KEY
                },
                body: JSON.stringify({
                    number: cleanNumber,
                    message: message
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `WhatsApp service returned ${response.status}`);
            }

            const data = await response.json();
            console.log(`[WHATSAPP] Message queued successfully: ${data.messageId}`);
            return data;
        } catch (error) {
            console.error('[WHATSAPP SERVICE ERROR]', error.message);
            // We don't throw error here to avoid breaking the donation flow if WhatsApp fails
            return null;
        }
    }

    /**
     * Send a general email via the communication bridge
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {Object} options - { text, html, name }
     */
    async sendEmail(to, subject, options = {}) {
        try {
            console.log(`[EMAIL] Sending email to ${to}...`);
            const response = await fetch(`${this.baseUrl}/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.WHATSAPP_SERVICE_API_KEY
                },
                body: JSON.stringify({
                    to,
                    subject,
                    text: options.text,
                    html: options.html,
                    name: options.name
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Email bridge returned ${response.status}`);
            }

            const data = await response.json();
            console.log(`[EMAIL] Email queued successfully: ${data.emailId}`);
            return data;
        } catch (error) {
            console.error('[EMAIL SERVICE ERROR]', error.message);
            return null;
        }
    }

    /**
     * Specialized: Send Donation Thank You email
     */
    async sendDonationEmail(to, donorName, amount) {
        const subject = "Thank you for your generous donation!";
        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <h2 style="color: #2c3e50; text-align: center;">🙏 Thank You, ${donorName}!</h2>
                <p>We have successfully received your donation of <strong>₹${amount}</strong>.</p>
                <p>Your contribution to <strong>The DharmArth Foundation</strong> helps us continue our mission of serving the community. We are deeply grateful for your support.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.9em; color: #777;">This is an automated receipt. If you have any questions, please contact us at support@dharmarth.org.</p>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="https://dharmarth.org" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit Our Website</a>
                </div>
            </div>
        `;
        return this.sendEmail(to, subject, { html, name: donorName });
    }

    /**
     * Specialized: Send Donation Thank You WhatsApp Notification
     */
    async sendDonationNotification(donorMobile, donorName, amount) {
        const Setting = require('../models/Setting');
        const setting = await Setting.findOne({ key: 'whatsapp_donation_template' });
        const template = setting?.value || "Dear {name}, thank you for your generous donation of ₹{amount} to The DharmArth Foundation. Your support helps us make a big difference! 🙏";
        const message = template.replace('{name}', donorName).replace('{amount}', amount);
        return this.sendMessage(donorMobile, message);
    }

    /**
     * Specialized: Send Payout Completion WhatsApp Notification
     */
    async sendWithdrawalNotification(mobile, name, amount) {
        const Setting = require('../models/Setting');
        const setting = await Setting.findOne({ key: 'whatsapp_withdrawal_template' });
        const template = setting?.value || "Dear {name}, your payout request of ₹{amount} has been successfully processed and completed. The funds have been transferred as per your provided details. Thank you for your continued support! 🙏";
        const message = template.replace('{name}', name).replace('{amount}', amount);
        return this.sendMessage(mobile, message);
    }

    /**
     * Specialized: Send L1 Motivator Commission Notification
     */
    async sendL1MotivatorNotification(motivatorMobile, data) {
        const Setting = require('../models/Setting');
        const setting = await Setting.findOne({ key: 'whatsapp_motivator_l1_template' });
        const template = setting?.value || "Congratulations {motivator_name}! You received ₹{commission} commission for a donation of ₹{donation_amount} from {donor_name} ({donor_mobile}). Level: 1 🙏";

        const message = template
            .replace(/{motivator_name}/g, data.motivatorName)
            .replace(/{commission}/g, data.commission)
            .replace(/{donation_amount}/g, data.donationAmount)
            .replace(/{donor_name}/g, data.donorName)
            .replace(/{donor_mobile}/g, data.donorMobile);

        return this.sendMessage(motivatorMobile, message);
    }

    /**
     * Specialized: Send L2 Motivator Commission Notification
     */
    async sendL2MotivatorNotification(motivatorMobile, data) {
        const Setting = require('../models/Setting');
        const setting = await Setting.findOne({ key: 'whatsapp_motivator_l2_template' });
        const template = setting?.value || "Level 2 Bonus! {motivator_name}, you received ₹{commission} commission via {l1_motivator_name} ({l1_motivator_mobile}) for a donation from {donor_name} ({donor_mobile}). Level: 2 🙏";

        const message = template
            .replace(/{motivator_name}/g, data.motivatorName)
            .replace(/{commission}/g, data.commission)
            .replace(/{donation_amount}/g, data.donationAmount)
            .replace(/{donor_name}/g, data.donorName)
            .replace(/{donor_mobile}/g, data.donorMobile)
            .replace(/{l1_motivator_name}/g, data.l1MotivatorName)
            .replace(/{l1_motivator_mobile}/g, data.l1MotivatorMobile);

        return this.sendMessage(motivatorMobile, message);
    }
}

module.exports = new WhatsappService();
