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
                    'Content-Type': 'application/json'
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
     * Specialized: Send Donation Thank You Notification
     */
    async sendDonationNotification(donorMobile, donorName, amount) {
        const message = `Dear ${donorName}, thank you for your generous donation of ₹${amount} to The DharmArth Foundation. Your support helps us make a big difference! 🙏`;
        return this.sendMessage(donorMobile, message);
    }
}

module.exports = new WhatsappService();
