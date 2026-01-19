require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedEvents = async () => {
    try {
        await connectDB();

        // Find a user to assign as creator
        const user = await User.findOne();
        const userId = user ? user._id : null;

        const dummyEvents = [];
        const eventTypes = ['upcoming', 'ongoing', 'completed'];

        // Unsplash images for variety
        const images = [
            'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=1000&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=1000&auto=format&fit=crop'
        ];

        // Clear existing events to avoid duplicates if run multiple times (optional, but good for "dummy data" request)
        // Commenting out deleteMany to append if user wants more, but usually seeding implies fresh state or adding provided.
        // User asked to "create 3-4 dummy entries", implies addition. I'll just add.

        eventTypes.forEach((status, typeIndex) => {
            for (let i = 1; i <= 4; i++) {
                const title = `Dummy ${status.charAt(0).toUpperCase() + status.slice(1)} Event ${i}`;
                const slug = `${status}-event-${i}-${Date.now()}`; // Ensure uniqueness
                const image = images[(typeIndex * 4 + i) % images.length];

                let date;
                if (status === 'upcoming') {
                    date = new Date();
                    date.setDate(date.getDate() + (i * 5)); // 5, 10, 15, 20 days later
                } else if (status === 'ongoing') {
                    date = new Date(); // Now
                } else {
                    date = new Date();
                    date.setDate(date.getDate() - (i * 10)); // Past
                }

                dummyEvents.push({
                    title: title,
                    slug: slug,
                    coverImage: image,
                    heroImages: [image],
                    date: date,
                    location: 'City Convention Center, New Delhi',
                    shortDescription: `This is a short description for the ${status} event ${i}. It highlights the key objectives and expected outcomes used for testing the UI.`,
                    status: status,
                    blocks: [
                        {
                            type: 'text',
                            content: `<p>This is a detailed description of <strong>${title}</strong>.</p><p>We aim to bring communities together to celebrate and support our cause. This event will feature various activities including keynote speeches, workshops, and networking sessions.</p><p>Join us to make a difference!</p>`,
                            id: `block-${status}-${i}-text`
                        },
                        {
                            type: 'image',
                            content: {
                                url: image,
                                caption: 'Event Highlights'
                            },
                            id: `block-${status}-${i}-img`
                        }
                    ],
                    metaTitle: `${title} - Dharmarth Foundation`,
                    metaDescription: `Join us for ${title}.`,
                    createdBy: userId,
                    isPublished: true
                });
            }
        });

        await Event.insertMany(dummyEvents);
        console.log(`Successfully seeded ${dummyEvents.length} events!`);

        process.exit();
    } catch (error) {
        console.error('Error seeding events:', error);
        process.exit(1);
    }
};

seedEvents();
