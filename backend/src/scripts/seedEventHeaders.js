require('dotenv').config();
const mongoose = require('mongoose');
const EventHeader = require('../models/EventHeader');
const connectDB = require('../config/db');

const seedEventHeaders = async () => {
    try {
        await connectDB();

        console.log('Clearing existing event headers...');
        await EventHeader.deleteMany({});

        const dummyHeaders = [
            {
                type: 'image',
                url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1920&auto=format&fit=crop',
                title: 'Empowering Communities',
                title_hi: 'समुदायों को सशक्त बनाना',
                subtitle: 'Join our mission to create a better world',
                subtitle_hi: 'एक बेहतर दुनिया बनाने के हमारे मिशन में शामिल हों',
                description: 'We work tirelessly to provide education, healthcare, and support to those in need.',
                description_hi: 'हम जरूरतमंदों को शिक्षा, स्वास्थ्य सेवा और सहायता प्रदान करने के लिए अथक प्रयास करते हैं।',
                ctaText: 'Donate Now',
                ctaText_hi: 'अभी दान करें',
                ctaLink: '/donate',
                titleColor: '#ffffff',
                descriptionColor: '#f0f0f0',
                textPosition: 'center',
                isActive: true,
                order: 1
            },
            {
                type: 'video',
                url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
                title: 'Our Impact in Action',
                title_hi: 'हमारा प्रभाव कार्रवाई में',
                subtitle: 'Watch how your contributions change lives',
                subtitle_hi: 'देखें कि आपका योगदान कैसे जीवन बदलता है',
                description: 'Real stories from the people we have helped through your generous donations.',
                description_hi: 'उन लोगों की सच्ची कहानियाँ जिनकी हमने आपके उदार दान के माध्यम से मदद की है।',
                ctaText: 'Watch More',
                ctaText_hi: 'अधिक देखें',
                ctaLink: '/gallery',
                titleColor: '#ffffff',
                descriptionColor: '#ffffff',
                textPosition: 'left',
                isActive: true,
                order: 2
            },
            {
                type: 'image',
                url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1920&auto=format&fit=crop',
                title: 'Education for Every Child',
                title_hi: 'हर बच्चे के लिए शिक्षा',
                subtitle: 'Knowledge is the key to a brighter future',
                subtitle_hi: 'ज्ञान उज्ज्वल भविष्य की कुंजी है',
                description: 'Supporting schools and providing learning materials to underprivileged children.',
                description_hi: 'वंचित बच्चों को स्कूलों में सहायता और सीखने की सामग्री प्रदान करना।',
                ctaText: 'Learn More',
                ctaText_hi: 'अधिक जानें',
                ctaLink: '/events',
                titleColor: '#fbbf24', // Amber color
                descriptionColor: '#ffffff',
                textPosition: 'right',
                isActive: true,
                order: 3
            },
            {
                type: 'image',
                url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=1920&auto=format&fit=crop',
                title: 'Healthcare for All',
                title_hi: 'सभी के लिए स्वास्थ्य सेवा',
                subtitle: 'Providing medical aid to remote areas',
                subtitle_hi: 'दूरदराज के इलाकों में चिकित्सा सहायता प्रदान करना',
                description: 'Our mobile clinics reach where traditional healthcare cannot reach.',
                description_hi: 'हमारे मोबाइल क्लीनिक वहां पहुंचते हैं जहां पारंपरिक स्वास्थ्य सेवा नहीं पहुंच पाती है।',
                ctaText: 'Get Involved',
                ctaText_hi: 'शामिल हों',
                ctaLink: '/contact',
                titleColor: '#ffffff',
                descriptionColor: '#ffffff',
                textPosition: 'top-left',
                isActive: true,
                order: 4
            }
        ];

        await EventHeader.insertMany(dummyHeaders);
        console.log(`Successfully seeded ${dummyHeaders.length} event headers!`);

        process.exit();
    } catch (error) {
        console.error('Error seeding event headers:', error);
        process.exit(1);
    }
};

seedEventHeaders();
