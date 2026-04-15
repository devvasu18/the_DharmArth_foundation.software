require('dotenv').config(); // Load env for consistency
const mongoose = require('mongoose');
const User = require('../models/User');
const Permission = require('../models/Permission');
const connectDB = require('../config/db');

const seedData = async () => {
    await connectDB();

    // 1. Init Permissions
    const modules = [
        { moduleName: 'User Management', availableActions: ['view', 'create', 'edit', 'delete'] },
        { moduleName: 'Role Management', availableActions: ['view', 'create', 'edit', 'delete'] },
        { moduleName: 'Content Management', availableActions: ['view', 'create', 'edit', 'delete'] },
        { moduleName: 'Donations', availableActions: ['view', 'edit'] },
        { moduleName: 'Settings', availableActions: ['view', 'edit'] },
        { moduleName: 'Prescription Management', availableActions: ['view', 'edit'] },
        { moduleName: 'Order Management', availableActions: ['view', 'edit'] },
        { moduleName: 'Delivery Management', availableActions: ['view', 'create', 'edit', 'delete'] },
    ];

    for (const mod of modules) {
        await Permission.findOneAndUpdate(
            { moduleName: mod.moduleName },
            mod,
            { upsert: true, new: true }
        );
    }
    console.log('Permissions seeded.');

    // 2. Init Super Admin
    const adminMobile = '9999999999'; // Default super admin mobile
    const adminEmail = 'admin@dharmarth.org';

    const existingAdmin = await User.findOne({ isSuperAdmin: true });
    if (!existingAdmin) {
        // Create User
        const superAdmin = new User({
            name: 'Super Admin',
            mobile: adminMobile,
            email: adminEmail,
            password: '123456',
            isSuperAdmin: true
        });

        await superAdmin.save();
        console.log(`Super Admin created: ${adminMobile} / 123456`);
    } else {
        console.log('Super Admin already exists.');
        // Optional: Update password if needed, but skipping for now to avoid overwriting user preference
    }

    process.exit();
};

seedData();
