// api/health.js - Health check endpoint for monitoring
import { createLogger } from './utils/logging';

// Create a logger for this module
const logger = createLogger('Health');

/**
 * Health check endpoint
 * 
 * Provides a simple status endpoint for monitoring systems to check
 * that the API is up and running.
 */
export default function handler(req, res) {
  logger.info('Health check requested');
  
  return res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
} 