/**
 * Verification script for WhatsApp Service integration
 */
require('dotenv').config();
const whatsappService = require('../src/services/whatsappService');

async function verify() {
    console.log("Checking WhatsApp Service Configuration...");
    const url = process.env.WHATSAPP_SERVICE_URL || 'http://44.203.78.96:10000';
    console.log("URL:", url);

    if (!process.env.WHATSAPP_SERVICE_URL) {
        console.error("❌ WHATSAPP_SERVICE_URL is not set in .env");
        return;
    }

    console.log("Attempting to send a test notification...");
    try {
        // This will likely fail with ECONNREFUSED if the service isn't running on port 3000
        // but we want to see if it correctly constructs the request.
        const result = await whatsappService.sendDonationNotification("919876543210", "Test Donor", "100");

        if (result) {
            console.log("✅ Test notification request successful (Message ID:", result.messageId, ")");
        } else {
            console.log("⚠️ Test notification request failed or service unreachable (Check console logs above)");
        }
    } catch (err) {
        console.error("❌ Unexpected error during verification:", err.message);
    }
}

verify();
