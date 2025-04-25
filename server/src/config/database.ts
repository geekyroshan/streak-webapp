import mongoose from 'mongoose';
import * as memoryServer from '../services/mongodb-memory-server';

let isConnected = false;

export const connectDatabase = async () => {
  // If already connected, return
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/github-streak-manager';
    
    // Connection options optimized for serverless
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };
    
    try {
      await mongoose.connect(mongoURI, options);
      isConnected = true;
      console.log('MongoDB connection established successfully');
    } catch (error) {
      console.warn('Failed to connect to MongoDB database, falling back to in-memory database');
      // Fall back to in-memory database, not recommended for production
      if (process.env.NODE_ENV !== 'production') {
        await memoryServer.connect();
        isConnected = true;
      } else {
        throw new Error('Cannot connect to MongoDB and in-memory database is not available in production');
      }
    }
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}; 