const mongoose = require('mongoose');

let isConnected = false;
let memoryStoreActive = false;

const connectDB = async () => {
  if (isConnected) return;

  // In test environment without explicit URI, default immediately to fast in-memory
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_MONGODB_URI) {
    memoryStoreActive = true;
    return;
  }

  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civiclens';

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    console.log(`[CivicLens DB] Connected successfully to MongoDB at: ${mongoURI}`);
  } catch (error) {
    console.warn(`[CivicLens DB] Warning: Could not connect to external MongoDB (${error.message}).`);
    console.warn('[CivicLens DB] Operating with in-memory resilient fallback adapter for zero-dependency execution.');
    memoryStoreActive = true;
  }
};

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  isConnected: () => isConnected,
  isMemoryFallback: () => memoryStoreActive
};
