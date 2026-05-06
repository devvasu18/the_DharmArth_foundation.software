const NotificationQueue = require('../models/NotificationQueue');

/**
 * WhatsApp Service
 * Handles communication with the external whatsapp_service_backend
 * Integrated with a persistent queue to ensure 100% delivery reliability
 */
class WhatsappService {
    constructor() {
        this.baseUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3000';
        this.isProcessing = false;
        this.workerInterval = null;
    }

    /**
     * Start the background worker to process the notification queue
     * @param {number} intervalMs - How often to check the queue (default 30s)
     */
    startWorker(intervalMs = 30000) {
        if (this.workerInterval) return;

        console.log(`[NOTIFICATION WORKER] Started with ${intervalMs}ms interval`);
        this.workerInterval = setInterval(() => this.processQueue(), intervalMs);

        // Also run once immediately on startup
        setTimeout(() => this.processQueue(), 5000);
    }

    /**
     * Internal: Get the recipient's language preference
     */
    async _getRecipientLanguage(mobile) {
        try {
            const User = require('../models/User');
            // Clean mobile and look for last 10 digits
            const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
            const user = await User.findOne({ mobile: { $regex: cleanMobile + '$' } });
            return user?.language || 'hi';
        } catch (error) {
            return 'hi';
        }
    }

    /**
     * Internal: Get dynamic template based on language
     */
    async _getTemplate(baseKey, lang) {
        const Setting = require('../models/Setting');
        const key = lang === 'hi' ? `${baseKey}_hi` : baseKey;
        const setting = await Setting.findOne({ key });
        if (setting?.value) return setting.value;

        // Fallback to other language
        const fallbackKey = lang === 'hi' ? baseKey : `${baseKey}_hi`;
        const fallbackSetting = await Setting.findOne({ key: fallbackKey });
        return fallbackSetting?.value;
    }

    /**
     * Process pending notifications in the queue
     */
    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Find up to 10 pending or failed (with < 5 attempts) notifications
            const pending = await NotificationQueue.find({
                status: { $in: ['pending', 'failed'] },
                attempts: { $lt: 5 },
                scheduledAt: { $lte: new Date() }
            }).sort({ createdAt: 1 }).limit(10);

            if (pending.length > 0) {
                console.log(`[NOTIFICATION WORKER] 🔍 Found ${pending.length} notifications to process. Starting batch...`);
            }

            for (const item of pending) {
                await this._processItem(item);
            }
        } catch (error) {
            console.error('[NOTIFICATION WORKER ERROR]', error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Internal: Process a single queue item
     */
    async _processItem(item) {
        item.status = 'processing';
        item.attempts += 1;
        await item.save();

        try {
            let success = false;
            if (item.type === 'whatsapp') {
                success = await this._sendWhatsAppNow(item.recipient, item.content);
            } else if (item.type === 'email') {
                success = await this._sendEmailNow(item.recipient, item.content);
            }

            if (success) {
                item.status = 'sent';
                console.log(`[NOTIFICATION WORKER] Successfully sent ${item.type} to ${item.recipient}`);
            } else {
                throw new Error('Delivery failed (Service returned null or error)');
            }
        } catch (error) {
            console.error(`[NOTIFICATION WORKER] ❌ FAILED attempt ${item.attempts} for ${item.recipient}:`, error.message);
            item.status = 'failed';
            item.lastError = error.message;
            // Exponential backoff: retry after 5m, 15m, 1h, 4h
            const backoffMinutes = [5, 15, 60, 240][item.attempts - 1] || 1440;
            item.scheduledAt = new Date(Date.now() + backoffMinutes * 60000);
        }

        await item.save();
    }

    /**
     * Internal: Direct HTTP call to WhatsApp Service for WhatsApp
     */
    async _sendWhatsAppNow(number, message) {
        const cleanNumber = String(number).replace(/\D/g, '');
        const response = await fetch(`${this.baseUrl}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.WHATSAPP_SERVICE_API_KEY,
                'bypass-tunnel-reminder': 'true',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ number: cleanNumber, message })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error body');
            console.error(`[WHATSAPP SERVICE] ❌ External service returned ${response.status}:`, errorText);
            return false;
        }
        const data = await response.json();
        console.log(`[WHATSAPP SERVICE] ✅ Successfully delivered to tunnel! Message ID: ${data.success || data.messageId}`);
        return !!data.success || !!data.messageId;
    }

    /**
     * Internal: Direct HTTP call to WhatsApp Service for Email
     */
    async _sendEmailNow(to, content) {
        const response = await fetch(`${this.baseUrl}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.WHATSAPP_SERVICE_API_KEY,
                'bypass-tunnel-reminder': 'true',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                to,
                subject: content.subject,
                text: content.text,
                html: content.html,
                name: content.name
            })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error body');
            console.error(`[EMAIL SERVICE] ❌ External service returned ${response.status}:`, errorText);
            return false;
        }
        const data = await response.json();
        console.log(`[EMAIL SERVICE] ✅ Successfully delivered to tunnel! Email ID: ${data.success || data.emailId}`);
        return !!data.success || !!data.emailId;
    }

    /**
     * Public: Queue a WhatsApp message
     */
    async sendMessage(number, message, metadata = {}) {
        try {
            await NotificationQueue.create({
                type: 'whatsapp',
                recipient: number,
                content: message,
                metadata
            });
            // Trigger background process immediately (non-blocking)
            this.processQueue().catch(() => { });
            return true;
        } catch (error) {
            console.error('[WHATSAPP QUEUE ERROR]', error.message);
            return false;
        }
    }

    /**
     * Public: Queue an Email
     */
    async sendEmail(to, subject, options = {}, metadata = {}) {
        try {
            await NotificationQueue.create({
                type: 'email',
                recipient: to,
                content: {
                    subject,
                    text: options.text,
                    html: options.html,
                    name: options.name
                },
                metadata
            });
            // Trigger background process immediately (non-blocking)
            this.processQueue().catch(() => { });
            return true;
        } catch (error) {
            console.error('[EMAIL QUEUE ERROR]', error.message);
            return false;
        }
    }

    /**
     * Specialized: Send Donation Thank You email
     */
    async sendDonationEmail(to, donorName, amount, donationId) {
        const subject = "Thank you for your generous donation!";
        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <h2 style="color: #2c3e50; text-align: center;">🙏 Thank You, ${donorName}!</h2>
                <p>We have successfully received your donation of <strong>₹${amount}</strong>.</p>
                <p>Your contribution to <strong>The DharmArth Foundation</strong> helps us continue our mission of serving the community.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.9em; color: #777;">Transaction ID: ${donationId}</p>
            </div>
        `;
        return this.sendEmail(to, subject, { html, name: donorName }, { donationId });
    }

    /**
     * Specialized: Send Donation Thank You WhatsApp Notification
     */
    async sendDonationNotification(donorMobile, donorName, amount, donationId) {
        const lang = await this._getRecipientLanguage(donorMobile);
        const template = await this._getTemplate('whatsapp_donation_template', lang) 
            || (lang === 'hi' ? "नमस्ते {name}, दान के लिए धन्यवाद।" : "Dear {name}, thank you for your donation.");
        
        const message = template.replace('{name}', donorName).replace('{amount}', amount);
        return this.sendMessage(donorMobile, message, { donationId });
    }

    /**
     * Specialized: Send Wallet Donation Thank You WhatsApp Notification
     */
    async sendWalletDonationNotification(donorMobile, donorName, amount, donationId) {
        const lang = await this._getRecipientLanguage(donorMobile);
        const template = await this._getTemplate('whatsapp_wallet_donation_template', lang) 
            || (lang === 'hi' ? "नमस्ते {name}, आपके वॉलेट से ₹{amount} के दान के लिए धन्यवाद।" : "Dear {name}, thank you for your donation of ₹{amount} from your wallet.");
        
        const message = template.replace('{name}', donorName).replace('{amount}', amount);
        return this.sendMessage(donorMobile, message, { donationId });
    }

    /**
     * Specialized: Send Payout Completion WhatsApp Notification
     */
    async sendWithdrawalNotification(mobile, name, amount) {
        const lang = await this._getRecipientLanguage(mobile);
        const template = await this._getTemplate('whatsapp_withdrawal_template', lang)
            || (lang === 'hi' ? "नमस्ते {name}, आपका भुगतान ₹{amount} सफल रहा।" : "Dear {name}, your payout of ₹{amount} was successful.");
            
        const message = template.replace('{name}', name).replace('{amount}', amount);
        return this.sendMessage(mobile, message);
    }

    /**
     * Specialized: Send Payout Failure WhatsApp Notification
     */
    async sendWithdrawalFailedNotification(mobile, name, amount, reason) {
        const message = `Dear ${name}, your payout request of ₹${amount} could not be processed due to: ${reason || 'Information mismatch'}. Please check your dashboard to correct the details. 🙏`;
        return this.sendMessage(mobile, message);
    }

    /**
     * Specialized: Send L1 Motivator Commission Notification
     */
    async sendL1MotivatorNotification(motivatorMobile, data) {
        const lang = await this._getRecipientLanguage(motivatorMobile);
        const template = await this._getTemplate('whatsapp_motivator_l1_template', lang)
            || (lang === 'hi' ? "बधाई हो {motivator_name}! आपको कमीशन मिला।" : "Congratulations {motivator_name}! You received commission.");

        const message = template
            .replace(/{motivator_name}/g, data.motivatorName)
            .replace(/{commission}/g, data.commission)
            .replace(/{donation_amount}/g, data.donationAmount)
            .replace(/{donor_name}/g, data.donorName)
            .replace(/{donor_mobile}/g, data.donorMobile);

        return this.sendMessage(motivatorMobile, message, { type: 'commission_l1' });
    }

    /**
     * Specialized: Send L2 Motivator Commission Notification
     */
    async sendL2MotivatorNotification(motivatorMobile, data) {
        const lang = await this._getRecipientLanguage(motivatorMobile);
        const template = await this._getTemplate('whatsapp_motivator_l2_template', lang)
            || (lang === 'hi' ? "बधाई हो {motivator_name}! आपको स्तर 2 कमीशन मिला।" : "Congratulations {motivator_name}! You received Level 2 commission.");

        const message = template
            .replace(/{motivator_name}/g, data.motivatorName)
            .replace(/{commission}/g, data.commission)
            .replace(/{donation_amount}/g, data.donationAmount)
            .replace(/{donor_name}/g, data.donorName)
            .replace(/{donor_mobile}/g, data.donorMobile)
            .replace(/{l1_motivator_name}/g, data.l1MotivatorName)
            .replace(/{l1_motivator_mobile}/g, data.l1MotivatorMobile);

        return this.sendMessage(motivatorMobile, message, { type: 'commission_l2' });
    }
    /**
     * Specialized: Send 80G Certificate Ready Notification
     */
    async send80GCertificateNotification(mobile, name, certificateUrl) {
        const fullUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}${certificateUrl}`;
        const message = `Dear ${name}, your 80G certificate is ready. 🙏\n\nYou can download it here: ${fullUrl}`;
        return this.sendMessage(mobile, message, { type: '80g_certificate' });
    }

    /**
     * Specialized: Send OTP for Payout Verification via WhatsApp
     */
    async sendPayoutOTP(mobile, otp) {
        const message = `Your OTP for The DharmArth Foundation *Withdrawal Authorization* is: *${otp}*. Valid for 10 minutes. Please do not share this code with anyone.`;
        return this._sendWhatsAppNow(mobile, message); // Direct send for time-critical OTP
    }

    /**
     * Specialized: Send OTP for Subscription Cancellation via WhatsApp
     */
    async sendCancelSubscriptionOTP(mobile, otp, amount) {
        const message = `Your OTP to authorize *Cancellation* of your ₹${amount} monthly donation at The DharmArth Foundation is: *${otp}*. Valid for 10 minutes.`;
        return this._sendWhatsAppNow(mobile, message); 
    }

    /**
     * Specialized: Send OTP for Wallet Donation via WhatsApp
     */
    async sendWalletDonationOTP(mobile, otp) {
        const lang = await this._getRecipientLanguage(mobile);
        const template = await this._getTemplate('whatsapp_wallet_otp_template', lang)
            || (lang === 'hi' ? "The DharmArth Foundation वॉलेट दान के लिए आपका OTP है: *{otp}*। यह 10 मिनट के लिए मान्य है।" : "Your OTP for The DharmArth Foundation *Wallet Donation* is: *{otp}*. Valid for 10 minutes.");
            
        const message = template.replace('{otp}', otp);
        return this._sendWhatsAppNow(mobile, message); // Direct send for time-critical OTP
    }

    /**
     * Specialized: Send OTP via WhatsApp
     */
    async sendOTP(mobile, otp) {
        const message = `Your OTP for The DharmArth Foundation login is: *${otp}*. Valid for 10 minutes`;
        return this._sendWhatsAppNow(mobile, message); // Direct send for time-critical OTP
    }

    /**
     * Specialized: Send Event Notification WhatsApp
     */
    async sendEventNotification(mobile, name, event) {
        const lang = await this._getRecipientLanguage(mobile);
        const eventUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${event.slug}`;
        
        let message;
        if (lang === 'hi') {
            message = `नमस्ते ${name}! 🙏\n\nहमने एक नया कार्यक्रम आयोजित किया है: *${event.title}*\n📅 तिथि: ${new Date(event.date).toLocaleDateString('hi-IN')}\n📍 स्थान: ${event.location || 'ऑनलाइन'}\n\n${event.shortDescription || ''}\n\nअधिक जानकारी और पंजीकरण के लिए यहाँ क्लिक करें: ${eventUrl}`;
        } else {
            message = `Hello ${name}! 🙏\n\nWe have organized a new event: *${event.title}*\n📅 Date: ${new Date(event.date).toLocaleDateString('en-IN')}\n📍 Location: ${event.location || 'Online'}\n\n${event.shortDescription || ''}\n\nClick here for more details and registration: ${eventUrl}`;
        }
        
        return this.sendMessage(mobile, message, { type: 'event_notification', eventId: event._id });
    }

    /**
     * Specialized: Send OTP via Email
     */
    async sendOTPByEmail(email, otp, name = "User") {
        const subject = `${otp} is your verification code`;
        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <h2 style="color: #2c3e50; text-align: center;">Verification Code</h2>
                <p>Hello ${name},</p>
                <p>Your OTP for The DharmArth Foundation login/password reset is:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #00bfa5; padding: 10px 20px; border: 2px dashed #00bfa5; border-radius: 8px;">${otp}</span>
                </div>
                <p>This code is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.8em; color: #777; text-align: center;">If you didn't request this, please ignore this email.</p>
            </div>
        `;
        return this._sendEmailNow(email, { subject, html, name });
    }
}

module.exports = new WhatsappService();
