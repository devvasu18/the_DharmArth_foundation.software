const mongoose = require('mongoose');
const DoctorAvailability = require('../models/DoctorAvailability');
require('dotenv').config();

const checkDates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-app');
        console.log('Connected to MongoDB');

        const docs = await DoctorAvailability.find().limit(5);
        console.log('--- Sample Availability Records ---');
        docs.forEach(doc => {
            console.log(`ID: ${doc._id}, Date: ${doc.date.toISOString()}, Local: ${doc.date.toString()}`);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log(`\nServer "Today" (Local Midnight): ${today.toString()}`);
        console.log(`Server "Today" (ISO): ${today.toISOString()}`);

        const matches = await DoctorAvailability.find({ date: today });
        console.log(`\nMatches for today: ${matches.length}`);

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkDates();
