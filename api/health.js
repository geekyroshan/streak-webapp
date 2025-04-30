// api/health.js - Health check endpoint
import { createServerHandler } from './server-adapter';
import { createLogger } from './utils/logging';

// Create a logger for this module
const logger = createLogger('Health');

// Configure the routes for this serverless function
const configureRoutes = (app) => {
  app.get('/api/health', (req, res) => {
    return res.status(200).json({
      status: 'healthy',
      message: 'API is up and running',
      serverTime: new Date().toISOString(),
      serverlessMode: true,
      environment: process.env.NODE_ENV || 'development'
    });
  });
};

// Create a handler that configures and uses the Express app
const handler = createServerHandler(configureRoutes);

export default async function healthHandler(req, res) {
  logger.info(`Health check: ${req.method} ${req.url}`);
  
  try {
    // Pass the request to our handler
    return await handler(req, res);
  } catch (error) {
    logger.error('Error in health check:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
} 