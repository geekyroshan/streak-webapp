// Unified API Handler - Single Entry Point for All Routes
import express from 'express';
import app from '../server/dist/index.js';

// This is the single handler for all API routes
export default function handler(req, res) {
  console.log(`[Unified API] Request: ${req.method} ${req.url}`);
  
  // Forward all requests to Express app
  return new Promise((resolve, reject) => {
    // Use the Express app directly
    app(req, res);
    
    // Listen for completion
    res.on('finish', () => {
      console.log(`[Unified API] Response complete for ${req.url}`);
      resolve();
    });
    
    // Listen for errors
    res.on('error', (error) => {
      console.error(`[Unified API] Error for ${req.url}:`, error);
      reject(error);
    });
  });
} 