// This is the main API handler file for Vercel serverless functions
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// MongoDB connection
let isConnected = false;
const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined');
    }
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Create Express app
const app = express();

// CORS setup
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins in production
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Simple test route
app.get('/api', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Example auth route
app.get('/api/auth/status', (req, res) => {
  res.json({ isAuthenticated: false, message: 'Authentication check' });
});

// Export the serverless function handler
module.exports = async (req, res) => {
  // Connect to database
  try {
    await connectToDatabase();
  } catch (error) {
    return res.status(500).json({ error: 'Database connection failed' });
  }
  
  // Process the request with Express
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}; 