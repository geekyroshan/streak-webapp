// api/catchall.js - Catchall handler for API routes not explicitly defined
import app from '../server/dist/index.js';
import { createLogger } from './utils/logging';

// Create a logger for this module
const logger = createLogger('Catchall');

/**
 * Catchall API handler
 * 
 * This handler serves as a fallback for API routes that don't have
 * explicit handlers defined in the /api directory but do exist in
 * the Express application.
 * 
 * It's used by Vercel as a catchall route when no specific file-based
 * route matches the incoming request.
 */
export default function handler(req, res) {
  logger.info(`Catchall handling: ${req.method} ${req.url}`);
  
  // Forward the request to Express app
  return new Promise((resolve, reject) => {
    // Handle the request with the app
    app(req, res);
    
    // Listen for completion
    res.on('finish', () => {
      logger.info(`Catchall response finished for ${req.url}`);
      resolve();
    });
    
    // Listen for errors
    res.on('error', (error) => {
      logger.error(`Catchall error for ${req.url}:`, error);
      reject(error);
    });
  });
} 