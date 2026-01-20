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

        console.log('Clearing existing events...');
        await Event.deleteMany({}); // Start fresh to show off the new structure

        const dummyEvents = [];
        const eventTypes = ['upcoming', 'ongoing', 'completed'];

        // Resources
        const images = [
            'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop', // Kids
            'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=1000&auto=format&fit=crop', // Medical
            'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1000&auto=format&fit=crop', // Education
            'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=1000&auto=format&fit=crop', // Hands
            'https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=1000&auto=format&fit=crop', // Old age
            'https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=1000&auto=format&fit=crop'  // Book
        ];

        const youtubeLinks = [
            'https://www.youtube.com/watch?v=LXb3EKWsInQ', // Generic nature/demo 
            'https://www.youtube.com/watch?v=FjHGZj2IjBk'
        ];

        const sampleVideo = 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4';
        const instagramLink = 'https://www.instagram.com/p/Clw80i9P9l_/'; // Example 

        eventTypes.forEach((status, typeIndex) => {
            for (let i = 1; i <= 4; i++) {
                const title = `Varied Content ${status.charAt(0).toUpperCase() + status.slice(1)} Event ${i}`;
                const slug = `${status}-rich-event-${i}-${Date.now()}`;
                const image = images[(typeIndex * 4 + i) % images.length];

                let date;
                if (status === 'upcoming') {
                    date = new Date();
                    date.setDate(date.getDate() + (i * 5));
                } else if (status === 'ongoing') {
                    date = new Date();
                } else {
                    date = new Date();
                    date.setDate(date.getDate() - (i * 10));
                }

                // Create a mix of blocks for this event
                const blocks = [];

                // 1. Always start with some text
                blocks.push({
                    type: 'text',
                    content: {
                        html: `<p>Welcome to <strong>${title}</strong>. This event demonstrates our diverse content capabilities. We believe in transparency and showing our impact through various media.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>`,
                    },
                    id: `block-${status}-${i}-text-intro`
                });

                // 2. Add specific media based on index to ensure variety across the 4 events
                if (i === 1) {
                    // Event 1: YouTube focus
                    blocks.push({
                        type: 'youtube',
                        content: {
                            url: youtubeLinks[0],
                            title: 'Our Journey So Far'
                        },
                        id: `block-${status}-${i}-yt`
                    });
                } else if (i === 2) {
                    // Event 2: Multiple Images (Gallery feel)
                    blocks.push({
                        type: 'image',
                        content: {
                            url: images[0],
                            title: 'Community Gathering'
                        },
                        id: `block-${status}-${i}-img1`
                    });
                    blocks.push({
                        type: 'image',
                        content: {
                            url: images[1],
                            title: 'Distribution Drive'
                        },
                        id: `block-${status}-${i}-img2`
                    });
                } else if (i === 3) {
                    // Event 3: Video File
                    blocks.push({
                        type: 'video',
                        content: {
                            url: sampleVideo,
                            caption: 'Official Event Trailer',
                            thumbnail: images[2]
                        },
                        id: `block-${status}-${i}-vid`
                    });
                } else {
                    // Event 4: Instagram & Text
                    blocks.push({
                        type: 'instagram',
                        content: {
                            url: instagramLink
                        },
                        id: `block-${status}-${i}-insta`
                    });
                    blocks.push({
                        type: 'text',
                        content: {
                            html: `<blockquote>"The best way to find yourself is to lose yourself in the service of others." - Mahatma Gandhi</blockquote>`,
                        },
                        id: `block-${status}-${i}-quote`
                    });
                }

                // 3. Ending text
                blocks.push({
                    type: 'text',
                    content: {
                        html: `<p>Thank you for your continued support. Stay tuned for more updates.</p>`,
                    },
                    id: `block-${status}-${i}-text-end`
                });

                dummyEvents.push({
                    title: title,
                    slug: slug,
                    coverImage: image,
                    heroImages: [image, images[(typeIndex + 1) % images.length]], // Multiple hero images for slider test
                    date: date,
                    location: 'City Convention Center, New Delhi',
                    shortDescription: `A rich content event (${status}) showcasing videos, images, and social embeds. Click to see the variety of blocks.`,
                    status: status,
                    blocks: blocks,
                    metaTitle: `${title} - Dharmarth Foundation`,
                    metaDescription: `Rich media event details for ${title}.`,
                    createdBy: userId,
                    isPublished: true
                });
            }
        });

        await Event.insertMany(dummyEvents);
        console.log(`Successfully seeded ${dummyEvents.length} events with mixed media types!`);

        process.exit();
    } catch (error) {
        console.error('Error seeding events:', error);
        process.exit(1);
    }
};

seedEvents();
