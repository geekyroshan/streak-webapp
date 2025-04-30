// This file creates a bridge between Vercel's serverless functions and your Express app
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createLogger } from './utils/logging';

// Create a logger for this module
const logger = createLogger('ServerAdapter');

// Create a lightweight Express app for serverless functions
const createServerlessApp = () => {
  const app = express();
  
  // Configure middleware similar to main app
  app.use(cors({
    origin: [
      'http://localhost:8080',
      'http://localhost:8081', 
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      process.env.CLIENT_URL || null,
    ].filter(Boolean),
    credentials: true
  }));
  
  app.use(express.json());
  app.use(cookieParser());
  
  return app;
};

/**
 * Creates a serverless handler for API endpoints
 * 
 * @param {Function} routeHandler - Function that configures routes on the Express app
 * @returns {Function} A handler function for serverless environments
 */
export function createServerHandler(routeHandler) {
  // Create an Express app instance for this serverless function
  const app = createServerlessApp();
  
  return async (req, res) => {
    try {
      logger.info(`Request received: ${req.method} ${req.url}`);
      
      // If a route handler was provided, apply it to the app
      if (routeHandler) {
        routeHandler(app);
      }
      
      // Use Express to handle the request
      await new Promise((resolve, reject) => {
        app(req, res, (err) => {
          if (err) {
            logger.error(`Error in middleware: ${err.message}`);
            return reject(err);
          }
          
          // If no route matched, send 404
          if (!res.headersSent) {
            logger.warn(`No route matched for ${req.url}`);
            res.status(404).json({
              error: 'Not found',
              message: `Route ${req.url} not found`
            });
          }
          
          resolve();
        });
      });
    } catch (error) {
      logger.error(`Error processing request to ${req.url}:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    }
  };
} 