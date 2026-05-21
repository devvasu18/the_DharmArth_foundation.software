require('dotenv').config();
const connectDB = require('./src/config/db');
const Slider = require('./src/models/Slider');

async function run() {
    await connectDB();
    const sliders = await Slider.find({});
    console.log("=== SLIDERS ===");
    console.log(JSON.stringify(sliders, null, 2));
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
