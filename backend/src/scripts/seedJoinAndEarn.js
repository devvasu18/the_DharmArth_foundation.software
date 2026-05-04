const mongoose = require('mongoose');
const path = require('path');
const Page = require('../models/Page');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const seedJoinAndEarnPage = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete existing if any
        await Page.findOneAndDelete({ slug: 'join-and-earn' });

        const joinPage = new Page({
            title: 'Join & Earn',
            slug: 'join-and-earn',
            status: 'published',
            seo: {
                metaTitle: 'Join & Earn - Become a Motivator for The DharmArth Foundation',
                metaDescription: 'Join our community of motivators, help us raise funds for noble causes, and earn incentives while making a real difference in the world.'
            },
            components: [
                {
                    type: 'slider',
                    order: 0,
                    data: {
                        title: 'Empower Change. Earn Rewards.',
                        sliderType: 'hero',
                        slides: [{
                            title: 'Become a Mission Partner',
                            subtitle: 'Join The DharmArth Foundation as a motivator. Help us connect donors with life-changing causes and earn transparent incentives for your impact.',
                            image: '/assets/cms/hero-default.png',
                            buttonText: 'Join Now',
                            buttonLink: '/register'
                        }]
                    }
                },
                {
                    type: 'process',
                    order: 1,
                    data: {
                        title: 'How It Works',
                        subtitle: 'A simple, transparent process to start your journey as a motivator.',
                        steps: [
                            { title: 'Create Account', description: 'Register as a motivator in less than 2 minutes.' },
                            { title: 'Share the Mission', description: 'Connect donors to our verified social causes using your unique link.' },
                            { title: 'Drive Impact', description: 'Help us provide food, health, and education to those in need.' },
                            { title: 'Earn Incentives', description: 'Receive recurring referral benefits for every successful contribution.' }
                        ]
                    }
                },
                {
                    type: 'stats',
                    order: 2,
                    data: {
                        items: [
                            { label: 'Active Motivators', value: '2,500+', icon: 'Users' },
                            { label: 'Lives Impacted', value: '150k+', icon: 'Heart' },
                            { label: 'Total Contributions', value: '₹10Cr+', icon: 'Zap' },
                            { label: 'Verified Causes', value: '50+', icon: 'ShieldCheck' }
                        ]
                    }
                },
                {
                    type: 'features',
                    order: 3,
                    data: {
                        title: 'Why Join the Mission?',
                        subtitle: 'Beyond incentives, you are part of a transparent movement for global good.',
                        items: [
                            { title: 'Recurring Rewards', description: 'Earn benefits not just once, but for the lifetime of the donor subscription.', icon: 'RotateCw' },
                            { title: 'Real-time Tracking', description: 'Monitor your impact and earnings through a professional dashboard.', icon: 'BarChart3' },
                            { title: 'Direct Bank Payouts', description: 'Fast, secure, and transparent payouts directly to your account.', icon: 'Wallet' },
                            { title: 'Impact Certification', description: 'Get recognized for your contributions to society.', icon: 'Award' }
                        ]
                    }
                },
                {
                    type: 'testimonial',
                    order: 4,
                    data: {
                        title: 'Voices of our Motivators',
                        items: [
                            { name: 'Amit Sharma', text: 'Being a motivator here has given me a sense of purpose and a steady side income that helps my family.', rating: 5, photo: 'https://i.pravatar.cc/150?u=amit' },
                            { name: 'Priya Verma', text: 'The transparency of The DharmArth Foundation is unmatched. I know exactly how my efforts are helping people.', rating: 5, photo: 'https://i.pravatar.cc/150?u=priya' }
                        ]
                    }
                },
                {
                    type: 'faq',
                    order: 5,
                    data: {
                        title: 'Frequently Asked Questions',
                        items: [
                            { question: 'Is there a joining fee?', answer: 'No, joining as a mission partner is completely free. We value your effort, not your money.' },
                            { question: 'How do I track my referrals?', answer: 'You get a dedicated dashboard to track every donor, their contributions, and your upcoming incentives in real-time.' },
                            { question: 'When do I get paid?', answer: 'Incentives are processed monthly and credited directly to your bank account.' }
                        ]
                    }
                },
                {
                    type: 'cta',
                    order: 6,
                    data: {
                        title: 'Ready to Start Your Mission?',
                        subtitle: 'Join 2,500+ motivators making the world a better place.',
                        buttonText: 'Register as Motivator',
                        buttonLink: '/register',
                        image: '/assets/cms/hero-default.png'
                    }
                }
            ]
        });

        await joinPage.save();
        console.log('Join & Earn page seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding page:', error);
        process.exit(1);
    }
};

seedJoinAndEarnPage();
