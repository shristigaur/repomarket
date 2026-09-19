const mongoose = require('mongoose');

async function connectDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.startsWith('your_')) {
    throw new Error('DATABASE_URL is not configured.');
  }

  await mongoose.connect(connectionString, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB');
}

module.exports = { connectDatabase };