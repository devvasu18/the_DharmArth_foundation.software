const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const Crowdfunding = require('../models/Crowdfunding');

const seedData = [
    {
        title: "Medical Bills are a Burden for Many Individuals and Families",
        title_hi: "कई व्यक्तियों और परिवारों के लिए चिकित्सा बिल एक बोझ हैं",
        text: "Expenses related to hospital stays, cancer treatments with high-cost chemotherapy routines, and other medicinal costs can be even higher. Treatment costs and necessary living expenses can bring the best of families to the brink of experiencing hard times. Insurance plans are not enough, as policies do not cover everything you need.",
        text_hi: "अस्पताल में रहने, उच्च लागत वाली कीमोथेरेपी और अन्य दवाओं का खर्च बहुत अधिक हो सकता है। यह परिवारों को कठिन समय में डाल सकता है। बीमा योजनाएं अक्सर पर्याप्त नहीं होती हैं।",
        imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop",
        order: 1,
        isVisible: true
    },
    {
        title: "Support Medical Crowdfunding",
        title_hi: "मेडिकल क्राउडफंडिंग का समर्थन करें",
        text: "Stop worrying about the helpless, and start supporting them with The Dharmarth Foundation. We are a Donation Platform dedicated to helping those in need. Crowdfunding is the easiest way to pool support from friends, family and compassionate individuals who are waiting to contribute funds.",
        text_hi: "असहायों के बारे में चिंता करना छोड़ें और धर्मार्थ फाउंडेशन के साथ उनका समर्थन करना शुरू करें। हम जरूरतमंदों की मदद करने के लिए समर्पित एक दान मंच हैं।",
        imageUrl: "https://images.unsplash.com/photo-1469571486040-0bad99321f8a?q=80&w=2070&auto=format&fit=crop",
        order: 2,
        isVisible: true
    },
    {
        title: "Contribute to Medical Aid for those in Need",
        title_hi: "जरूरतमंदों के लिए चिकित्सा सहायता में योगदान करें",
        text: "With The Dharmarth Foundation, you can make a quick, secure donation in minutes to support medical bills and healthcare costs for the underprivileged. You can also take on the role of spreading the word and bringing in support. Your contributions give hope to patients and families during their most difficult times.",
        text_hi: "धर्मार्थ फाउंडेशन के साथ, आप वंचितों के चिकित्सा बिलों के लिए मिनटों में सुरक्षित दान कर सकते हैं। आप जागरूकता फैलाने की भूमिका भी निभा सकते हैं।",
        imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop",
        order: 3,
        isVisible: true
    }
];

const seedCrowdfunding = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI not found in environment variables");
        }

        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB...");

        // Clear existing data
        await Crowdfunding.deleteMany({});
        console.log("Cleared existing Crowdfunding data.");

        // Insert new data
        await Crowdfunding.insertMany(seedData);
        console.log("Successfully seeded Crowdfunding sections!");

        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedCrowdfunding();
