const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (mongoUri && mongoUri.trim() !== '') {
      console.log(`Connecting to MongoDB at configured URI...`);
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }

    // Fallback for development/testing when no external MongoDB is running
    console.log('No MONGO_URI provided or local server unavailable. Starting in-memory MongoDB fallback...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`In-Memory MongoDB Connected at: ${uri}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    // If standard URI connection fails in dev mode, attempt memory server fallback
    if (!mongoMemoryServer && process.env.NODE_ENV !== 'production') {
      try {
        console.log('Attempting in-memory MongoDB fallback after connection failure...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const uri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(uri);
        console.log(`In-Memory MongoDB Fallback Connected at: ${uri}`);
        return conn;
      } catch (fallbackErr) {
        console.error(`Fallback failed: ${fallbackErr.message}`);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } catch (err) {
    console.error(`Error disconnecting DB: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
