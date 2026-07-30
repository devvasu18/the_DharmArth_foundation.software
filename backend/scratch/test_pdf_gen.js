require('dotenv').config({ path: '../.env' }); // Load env variables
const mongoose = require('mongoose');
const Donation = require('../src/models/Donation');
const certificateService = require('../src/services/certificateService');

async function run() {
    try {
        console.log("Connecting to MongoDB: ", process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected successfully!");

        const donationId = '6a6af3c9ec595e63f07174fb';
        const donation = await Donation.findById(donationId);
        if (!donation) {
            console.error("Donation not found:", donationId);
            return;
        }

        console.log("Found donation:", donation._id, donation.donorName);
        console.log("Running createCertificate...");
        const result = await certificateService.createCertificate(donation);
        console.log("Success! PDF path:", result);

        // Verify database update
        const updated = await Donation.findById(donationId);
        console.log("Updated donation record in database:", {
            receiptNumber: updated.receiptNumber,
            receiptUrl: updated.receiptUrl,
            certificateUrl: updated.certificateUrl
        });

    } catch (err) {
        console.error("ERROR during PDF receipt generation test:", err);
    } finally {
        await mongoose.connection.close();
        console.log("Connection closed.");
    }
}

run();
