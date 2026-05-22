require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const oneSignalService = require('../src/services/oneSignalService');

async function run() {
    console.log("=== ONESIGNAL VERIFICATION TEST START ===");
    try {
        await connectDB();
        const mobile = "9001025477";
        const user = await User.findOne({ mobile: mobile });

        if (!user) {
            console.error(`❌ User with mobile ${mobile} not found!`);
            return;
        }

        console.log(`Sending push using oneSignalService.sendPush to: ${user.name} (${user.mobile})`);

        // Test sending push notification using oneSignalService directly with useRingingSound: true (which has invalid channel)
        const result = await oneSignalService.sendPush({
            userIds: [user._id],
            title: "🔔 Antigravity Verification",
            message: "Push notifications are now working properly!",
            useRingingSound: true
        });

        console.log("\nFinal Service Result:", result);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
