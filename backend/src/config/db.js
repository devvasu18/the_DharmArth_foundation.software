const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-patch non-sparse email index on production database
    try {
        const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
        if (collections.length > 0) {
            const indexes = await mongoose.connection.db.collection('users').indexes();
            const emailIndex = indexes.find(idx => idx.name === 'email_1');
            if (emailIndex && !emailIndex.sparse) {
                console.log("[DB] Found non-sparse email index on production. Dropping and re-creating as a sparse index...");
                await mongoose.connection.db.collection('users').dropIndex('email_1');
                await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
                console.log("[DB] Successfully updated email index to be sparse!");
            }
        }
    } catch (indexErr) {
        console.error("[DB] Warning during email index self-check:", indexErr);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
