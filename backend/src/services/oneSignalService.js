const axios = require('axios');

class OneSignalService {
    constructor() {
        // You must set these in your .env file
        this.appId = process.env.ONESIGNAL_APP_ID;
        this.restApiKey = process.env.ONESIGNAL_REST_API_KEY;
        
        // Define default ringing channel properties (must match what's set up in Android)
        this.ringingChannelId = 'ringing_channel';
        this.ringingSound = 'ring.wav';
    }

    /**
     * Send a Push Notification via OneSignal
     * @param {Object} params 
     * @param {string|string[]} params.userIds - Array of OneSignal External IDs (your database User IDs)
     * @param {string} params.title - Notification Title
     * @param {string} params.message - Notification Message body
     * @param {boolean} params.useRingingSound - Whether to play the loud ringing sound
     */
    async sendPush({ userIds, title, message, useRingingSound = true }) {
        if (!this.appId || !this.restApiKey) {
            console.warn('[ONESIGNAL] App ID or REST API Key not configured. Skipping push notification.');
            return;
        }

        const externalIds = Array.isArray(userIds) ? userIds : [userIds];
        if (!externalIds.length || !externalIds[0]) return;

        const payload = {
            app_id: this.appId,
            include_aliases: {
                external_id: externalIds.map(id => String(id))
            },
            target_channel: 'push',
            headings: { en: title || 'New Notification' },
            contents: { en: message },
        };

        if (useRingingSound) {
            // iOS custom sound
            payload.ios_sound = this.ringingSound;
            
            // Android custom sound requires a channel to be set up on the device or dashboard
            payload.android_channel_id = this.ringingChannelId;

            // Optional: increase priority to wake up device
            payload.priority = 10; 
        }

        try {
            const response = await axios.post('https://api.onesignal.com/notifications', payload, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': `Basic ${this.restApiKey}`
                }
            });
            console.log(`[ONESIGNAL] Push sent to ${externalIds.join(', ')}:`, response.data);
            return response.data;
        } catch (error) {
            console.error('[ONESIGNAL] Failed to send push notification:', error.response?.data || error.message);
        }
    }
}

module.exports = new OneSignalService();
