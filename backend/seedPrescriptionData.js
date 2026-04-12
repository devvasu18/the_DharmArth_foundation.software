const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('./src/models/Medicine');
const BusRoute = require('./src/models/BusRoute');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dharmarth')
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => console.error(err));

const medicines = [
    { name: 'Paracetamol 500mg', brand: 'Dolo', price: 15, stock: 100, category: 'Tablet', isPrescriptionRequired: false },
    { name: 'Amoxicillin 250mg', brand: 'Mox', price: 45, stock: 50, category: 'Capsule', isPrescriptionRequired: true },
    { name: 'Cough Syrup', brand: 'Benadryl', price: 120, stock: 20, category: 'Syrup', isPrescriptionRequired: false },
    { name: 'Insulin Glargine', brand: 'Lantus', price: 850, stock: 5, category: 'Injection', isPrescriptionRequired: true },
    { name: 'Aspirin 75mg', brand: 'Ecosprin', price: 10, stock: 200, category: 'Tablet', isPrescriptionRequired: true }
];

const routes = [
    { routeName: 'Jaipur → Ajmer', stops: ['Jaipur', 'Bagru', 'Dudu', 'Ajmer'] },
    { routeName: 'Delhi → Jaipur', stops: ['Delhi', 'Gurgaon', 'Manesar', 'Neemrana', 'Jaipur'] }
];

const seed = async () => {
    try {
        await Medicine.deleteMany();
        await Medicine.insertMany(medicines);
        console.log('Medicines Seeded');

        await BusRoute.deleteMany();
        await BusRoute.insertMany(routes);
        console.log('Bus Routes Seeded');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seed();
