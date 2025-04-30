// This file creates a bridge between Vercel's serverless functions and your Express app
import express from 'express';
import { createServer } from 'http';
import { parse } from 'url';

// Import your Express app - modify path if needed
import app from '../server/dist/index.js';

export function createServerHandler() {
  return async (req, res) => {
    // Log that the serverless function was invoked
    console.log('[Serverless] Request received:', req.url);
    
    try {
      // Forward the request to your Express app
      await new Promise((resolve, reject) => {
        // Handle the request directly with the imported app
        app(req, res);
        
        // Listen for completion
        res.on('finish', () => {
          console.log('[Serverless] Response finished');
          resolve();
        });
        
        // Listen for errors
        res.on('error', (error) => {
          console.error('[Serverless] Response error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('[Serverless] Error processing request:', error);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    }
  };
} 