require('dotenv').config();
const mongoose = require('mongoose');
const Gallery = require('../../models/Gallery'); // Adjust path as backend is split between src/ and root
const connectDB = require('../config/db');

const seedGalleries = async () => {
    try {
        await connectDB();

        console.log('Clearing existing galleries...');
        await Gallery.deleteMany({});

        const dummyGalleries = [
            {
                title: 'Community Health Camp',
                description: 'A dedicated day for conducting free health checkups in rural areas. Our team of doctors and volunteers worked tirelessly to screen patients for common ailments.',
                coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60',
                images: [
                    'https://images.unsplash.com/photo-1576091160550-2187580018f7?w=1920&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1584515933487-779824d29309?w=1920&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1920&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1920&auto=format&fit=crop&q=80'
                ],
                isActive: true,
                order: 1
            },
            {
                title: 'Education for Everyone',
                description: 'Distributing books and learning materials to underprivileged children to ensure they have the resources to succeed.',
                coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=60',
                images: [
                    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1427504494785-3a9ca2801407?w=1920&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1920&auto=format&fit=crop&q=80'
                ],
                isActive: true,
                order: 2
            },
            {
                title: 'Clean Water Initiative',
                description: 'Installing water purifiers and ensuring clean drinking water access for villagers in remote locations.',
                coverImage: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800&auto=format&fit=crop&q=60',
                images: [
                    'https://images.unsplash.com/photo-1519681393798-38e43269d8e2?w=1920&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1534081333815-ae5019106622?w=1920&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1617155093730-a8bf47be792d?w=1920&auto=format&fit=crop&q=80'
                ],
                isActive: true,
                order: 3
            },
            {
                title: 'Women Empowerment Workshop',
                description: 'Skill development and vocational training workshops empowering women to become self-reliant.',
                coverImage: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&auto=format&fit=crop&q=60',
                images: [
                    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1920&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1573164574472-797cdf4a583a?w=1920&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=1920&auto=format&fit=crop&q=80'
                ],
                isActive: true,
                order: 4
            }
        ];

        await Gallery.insertMany(dummyGalleries);
        console.log(`Successfully seeded ${dummyGalleries.length} galleries!`);

        process.exit();
    } catch (error) {
        console.error('Error seeding galleries:', error);
        process.exit(1);
    }
};

seedGalleries();
