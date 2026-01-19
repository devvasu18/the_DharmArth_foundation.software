const mongoose = require('mongoose');
require('dotenv').config(); // Defaults to .env in CWD

const DoctorAvailability = require('../models/DoctorAvailability');
const Doctor = require('../models/Doctor');

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextDay = new Date(today);
        nextDay.setDate(nextDay.getDate() + 1);

        console.log('Checking availability for:', today);

        const availability = await DoctorAvailability.find({
            date: {
                $gte: today,
                $lt: nextDay
            }
        }).populate('doctorId');

        console.log('Total availability records found for today:', availability.length);

        if (availability.length > 0) {
            console.log('Sample record structure:');
            console.log(JSON.stringify(availability[0], null, 2));

            const govtDocs = availability.filter(a => a.doctorId && a.doctorId.type === 'government');
            console.log('Government doctors available today:', govtDocs.length);
        } else {
            console.log('No availability records found. Seed might be needed.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

checkData();
