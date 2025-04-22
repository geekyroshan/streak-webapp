import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer | null = null;

/**
 * Connect to the in-memory database.
 */
export const connect = async () => {
  if (process.env.NODE_ENV !== 'test' && process.env.MONGODB_URI) {
    // Use the provided MongoDB URI for non-test environments
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB: Real database');
    return;
  }
  
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB: In-memory database');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};

/**
 * Close the database connection.
 */
export const close = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) {
    await mongod.stop();
  }
};

/**
 * Clear the database, remove all data.
 */
export const clear = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

export default { connect, close, clear }; 