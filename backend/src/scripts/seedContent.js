require('dotenv').config();
const mongoose = require('mongoose');
const Slider = require('../models/Slider');
const Setting = require('../models/Setting');
const connectDB = require('../config/db');

const seedContent = async () => {
    await connectDB();

    // 1. Seed Generic Settings
    const settings = [
        { key: 'site_title', value: 'The Dharmarth Foundation', description: 'Main site title' },
        { key: 'show_save_life_banner', value: true, description: 'Toggle login page banner' },
        { key: 'commission_level_1', value: 10, description: 'Direct referral commission %' },
        { key: 'commission_level_2', value: 3, description: 'Indirect referral commission %' }
    ];

    for (const s of settings) {
        await Setting.findOneAndUpdate({ key: s.key }, s, { upsert: true });
    }
    console.log('Settings seeded.');

    // 2. Seed Mock Sliders
    const sliders = [
        {
            title: 'Help Feed The Hungry',
            subtitle: 'Join us in our mission to end hunger.',
            imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2670&auto=format&fit=crop',
            order: 1
        },
        {
            title: 'Medical Aid for the Poor',
            subtitle: 'Saving lives, one treatment at a time.',
            imageUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2670&auto=format&fit=crop',
            order: 2
        },
        {
            title: 'Education for All',
            subtitle: 'Empowering the next generation.',
            imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2670&auto=format&fit=crop',
            order: 3
        },
        {
            title: 'Start a Fundraiser',
            subtitle: 'Raise funds for a cause you care about.',
            imageUrl: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=2670&auto=format&fit=crop',
            order: 4
        }
    ];

    // Clear existing for clean slate or upsert? Upsert better.
    // Actually, just checking if any exist to avoid dupes if running multiple times without unique key on title
    const count = await Slider.countDocuments();
    if (count === 0) {
        await Slider.insertMany(sliders);
        console.log('Sliders seeded.');
    } else {
        console.log('Sliders already exist.');
    }

    process.exit();
};

seedContent();
