// api/catchall.js - Catchall handler for API routes not explicitly defined
import { createServerHandler } from './server-adapter';
import { createLogger } from './utils/logging';
import express from 'express';

// Create a logger for this module
const logger = createLogger('Catchall');

// Configure the routes for this serverless function
const configureRoutes = (app) => {
  // Add a simple catch-all route to report which route was attempted
  app.all('/api/*', (req, res) => {
    logger.warn(`No specific handler found for: ${req.method} ${req.url}`);
    
    return res.status(404).json({
      error: 'Not found',
      message: `API route '${req.url}' not found or not implemented in serverless mode`,
      requestedMethod: req.method,
      requestedPath: req.url,
      serverlessMode: true
    });
  });
};

// Create a handler that configures and uses the Express app
const handler = createServerHandler(configureRoutes);

export default async function catchallHandler(req, res) {
  logger.info(`Catchall handling: ${req.method} ${req.url}`);
  
  try {
    // Pass the request to our handler
    return await handler(req, res);
  } catch (error) {
    logger.error(`Catchall error for ${req.url}:`, error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        path: req.url
      });
    }
  }
} 