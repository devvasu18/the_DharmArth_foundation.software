const mongoose = require('mongoose');
require('dotenv').config();
const DoctorReport = require('../src/models/DoctorReport');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");
        const reports = await DoctorReport.find({}).sort({ createdAt: -1 }).limit(5);
        console.log("Latest reports in DB:");
        reports.forEach(r => {
            console.log(`ID: ${r._id}, Name: ${r.patientName}, Mobile: ${r.patientMobile}, Token: ${r.secureToken}`);
        });
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

check();
