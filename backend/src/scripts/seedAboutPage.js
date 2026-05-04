const mongoose = require('mongoose');
const path = require('path');
const Page = require('../models/Page');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const seedAboutPage = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete existing if any
        await Page.findOneAndDelete({ slug: 'about-us' });

        const aboutPage = new Page({
            title: 'About Us',
            slug: 'about-us',
            status: 'published',
            seo: {
                metaTitle: 'About Us - The DharmArth Foundation',
                metaDescription: 'Learn about our mission, vision, and the impact we are creating across communities through transparency and direct support.'
            },
            components: [
                {
                    type: 'slider',
                    order: 0,
                    data: {
                        title: 'Our Mission & Vision',
                        sliderType: 'hero',
                        slides: [{
                            title: 'Pioneering Transparent Social Change',
                            subtitle: 'We believe in direct impact. Every rupee you contribute goes directly to the cause you choose, tracked in real-time.',
                            image: '/assets/cms/hero-default.png',
                            buttonText: 'See Our Impact',
                            buttonLink: '#reach',
                            contentPosition: 'center',
                            titleColor: '#ffffff',
                            subtitleColor: '#f1f5f9',
                            btnBgColor: '#00bfa5',
                            btnTextColor: '#ffffff'
                        }]
                    }
                },
                {
                    type: 'stats',
                    order: 1,
                    data: {
                        title: 'Our Global Reach',
                        items: [
                            { label: 'States Covered', value: '18+', icon: 'Map' },
                            { label: 'Beneficiaries', value: '250k+', icon: 'Users' },
                            { label: 'Verified NGOs', value: '120+', icon: 'ShieldCheck' },
                            { label: 'Total Funds Raised', value: '₹25Cr+', icon: 'Zap' }
                        ]
                    }
                },
                {
                    type: 'text_block',
                    order: 2,
                    data: {
                        title: 'Our Story',
                        content: 'Founded in 2020, The DharmArth Foundation was born out of a simple observation: donors wanted to help, but were skeptical about where their money actually went. We built a platform that bridges this gap using technology and radical transparency. Today, we support thousands of families across India, providing essentials like food, medical care, and education.',
                        alignment: 'center'
                    }
                },
                {
                    type: 'features',
                    order: 3,
                    data: {
                        title: 'Our Core Values',
                        subtitle: 'The principles that guide every decision we make.',
                        items: [
                            { title: '100% Transparency', description: 'Every transaction is logged and viewable by the donor.', icon: 'Eye' },
                            { title: 'Direct Impact', description: 'Funds go directly to the ground-level execution partners.', icon: 'Target' },
                            { title: 'Data Driven', description: 'We use real-time data to identify the most urgent needs.', icon: 'BarChart' },
                            { title: 'Community First', description: 'We work closely with local leaders to ensure sustainable change.', icon: 'Heart' }
                        ]
                    }
                },
                {
                    type: 'process',
                    order: 4,
                    data: {
                        title: 'Our Journey',
                        subtitle: 'How we grew from a small team to a nationwide movement.',
                        steps: [
                            { title: '2020: The Beginning', description: 'Launched our first feeding drive in Delhi during the pandemic.' },
                            { title: '2021: Digital Transformation', description: 'Developed our proprietary donor tracking system.' },
                            { title: '2022: Expanding Horizons', description: 'Partnered with over 50 verified NGOs across 10 states.' },
                            { title: '2023: Empowering Motivators', description: 'Launched our motivator network to scale our reach.' }
                        ]
                    }
                },
                {
                    type: 'testimonial',
                    order: 5,
                    data: {
                        title: 'Voices of Change',
                        items: [
                            { name: 'Rajesh Kumar', text: 'The DharmArth Foundation saved my daughter when we couldn\'t afford her surgery. I am forever grateful.', rating: 5, photo: 'https://i.pravatar.cc/150?u=rajesh' },
                            { name: 'Dr. Sunita Rao', text: 'As an NGO partner, I appreciate the efficiency and transparency they bring to the social sector.', rating: 5, photo: 'https://i.pravatar.cc/150?u=sunita' }
                        ]
                    }
                },
                {
                    type: 'cta',
                    order: 6,
                    data: {
                        title: 'Be the Change You Wish to See',
                        subtitle: 'Join us in our mission to bring light to the darkest corners of society.',
                        buttonText: 'Donate Now',
                        buttonLink: '/donate',
                        image: '/assets/cms/hero-default.png',
                        buttonPosition: 'center'
                    }
                }
            ]
        });

        await aboutPage.save();
        console.log('About Us page seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding page:', error);
        process.exit(1);
    }
};

seedAboutPage();
