const Donation = require('../models/Donation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { processDonationCommission } = require('../services/commissionService');
const certificateService = require('../services/certificateService');
const whatsappService = require('../services/whatsappService');

/**
 * @desc Handle all logic after a donation payment is successful
 * @param {string} orderId - Razorpay Order ID
 * @param {string} paymentId - Razorpay Payment ID
 * @param {object} io - Socket.io instance (optional)
 */
exports.completeDonation = async (orderId, paymentId, io) => {
    try {
        const donation = await Donation.findOne({ orderId });
        if (!donation) {
            console.error(`Donation record not found for Order ID: ${orderId}`);
            return;
        }

        if (donation.status === 'success') {
            console.log(`Donation ${donation._id} already processed.`);
            return;
        }

        // 1. Update Donation Status
        donation.status = 'success';
        donation.transactionId = paymentId;
        await donation.save();

        // 2. Extract Data
        const { 
            amount, 
            donorName, 
            donorMobile, 
            donorEmail, 
            motivatorMobile, 
            level1UserId, 
            is80G,
            address,
            city,
            state
        } = donation;

        // 3. Process Commission
        if (level1UserId) {
            console.log(`Processing commission for Donation: ${donation._id}`);
            await processDonationCommission(amount, motivatorMobile, donation._id, donorName, donorMobile, level1UserId);
        }

        // 4. Generate Receipt
        try {
            await certificateService.createCertificate(donation);
        } catch (err) {
            console.error("Receipt Generation Failed:", err);
        }

        // 5. Create Notification for Admin Dashboard
        try {
            // Get io from some global place or passed in. 
            // For now, let's just create the notification record.
            const notification = await Notification.create({
                type: 'DONATION',
                message: `New donation of ₹${amount} from ${donorName}`,
                referenceId: donation._id,
                onModel: 'Donation',
                isRead: false
            });
            
            if (io) {
                io.to('admin_notifications').emit('new_donation', notification);
            }
        } catch (err) {
            console.error("Admin Notification Creation Failed:", err);
        }

        // 6. Send WhatsApp/Email Notifications
        try {
            await whatsappService.sendDonationNotification(donorMobile, donorName, amount, donation._id);
            if (donorEmail) {
                await whatsappService.sendDonationEmail(donorEmail, donorName, amount, donation._id);
            }
        } catch (err) {
            console.error("Notifications Failed:", err);
        }

        // 7. Sync User Profile
        try {
            let donorUser = await User.findOne({ mobile: donorMobile });
            if (donorUser) {
                donorUser.email = donorEmail || donorUser.email;
                donorUser.address = address || donorUser.address;
                donorUser.city = city || donorUser.city;
                donorUser.state = state || donorUser.state;
                donorUser.lastMotivatorMobile = donorUser.lastMotivatorMobile || motivatorMobile;
            } else {
                donorUser = new User({
                    name: donorName,
                    mobile: donorMobile,
                    email: donorEmail || undefined,
                    address,
                    city,
                    state,
                    lastMotivatorMobile: motivatorMobile
                });
            }
            await donorUser.save();
        } catch (err) {
            console.error("User Profile Sync Failed:", err);
        }

        console.log(`Donation ${donation._id} completed successfully.`);
        return donation;
    } catch (error) {
        console.error("Error in completeDonation service:", error);
        throw error;
    }
};
