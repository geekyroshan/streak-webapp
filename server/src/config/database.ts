import mongoose from 'mongoose';
import * as memoryServer from '../services/mongodb-memory-server';

export const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/github-streak-manager';
    
    try {
      await mongoose.connect(mongoURI);
      console.log('MongoDB connection established successfully');
    } catch (error) {
      console.warn('Failed to connect to MongoDB database, falling back to in-memory database');
      // Fall back to in-memory database
      await memoryServer.connect();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}; 