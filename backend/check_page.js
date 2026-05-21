require('dotenv').config();
const connectDB = require('./src/config/db');
const Page = require('./src/models/Page');

async function run() {
    await connectDB();
    const page = await Page.findOne({ slug: 'join-and-earn' });
    console.log("=== CMS PAGE ===");
    console.log(JSON.stringify(page, null, 2));
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
