require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const connectDB = require('../config/db');

const createDeliveryRole = async () => {
    await connectDB();
    
    try {
        const roleName = 'Delivery boy';
        const existingRole = await Role.findOne({ name: roleName });
        
        if (existingRole) {
            console.log('Role "Delivery boy" already exists.');
        } else {
            const role = await Role.create({
                name: roleName,
                permissions: [
                    { module: 'Order Management', actions: ['view'] },
                    { module: 'Delivery Management', actions: ['view', 'edit'] }
                ]
            });
            console.log('Role "Delivery boy" created successfully!');
        }
    } catch (error) {
        console.error('Error creating role:', error);
    } finally {
        process.exit();
    }
};

createDeliveryRole();
