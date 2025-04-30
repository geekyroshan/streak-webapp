// Consolidated API router for Vercel
import { createLogger } from './utils/logging';
import createFallbackServer from './fallback-server';

// Create a logger for this module
const logger = createLogger('Router');

// Function to initialize or get the Express app
async function getExpressApp() {
  try {
    // Try to import the compiled app
    logger.info('Trying to import compiled Express app');
    
    // We'll try both possible paths due to the TS build issues
    try {
      // First try the proper build path
      const { default: app } = await import('../server/dist/index.js');
      logger.info('Successfully imported compiled Express app');
      return app;
    } catch (importError) {
      logger.warn('Failed to import compiled app, trying fallback path', importError);
      
      // Fall back to the source path if compilation failed
      try {
        const { default: app } = await import('../server/src/index.js');
        logger.info('Successfully imported source Express app');
        return app;
      } catch (srcImportError) {
        logger.error('Failed to import from src path:', srcImportError);
        throw srcImportError;
      }
    }
  } catch (error) {
    logger.error('Failed to import Express app, using fallback server:', error);
    
    // Use our fallback server
    logger.info('Initializing fallback server');
    return createFallbackServer();
  }
}

// Create a cache for the app instance
let appInstance = null;

/**
 * Main API router
 * 
 * This handler serves as the primary entry point for all API routes.
 * It forwards requests directly to the Express app.
 */
export default async function handler(req, res) {
  logger.info(`Request: ${req.method} ${req.url}`);
  
  // Get or initialize the Express app
  if (!appInstance) {
    try {
      appInstance = await getExpressApp();
      logger.info('App instance initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize app instance:', error);
      
      // Return error response
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Server initialization failed',
        message: error.message
      }));
      return;
    }
  }
  
  // Forward the request to Express app
  return new Promise((resolve, reject) => {
    try {
      // Handle the request with the app
      appInstance(req, res);
      
      // Listen for completion
      res.on('finish', () => {
        logger.info(`Response finished for ${req.url}`);
        resolve();
      });
      
      // Listen for errors
      res.on('error', (error) => {
        logger.error(`Response error for ${req.url}:`, error);
        reject(error);
      });
    } catch (error) {
      logger.error(`Error handling request ${req.url}:`, error);
      
      // Only send error if headers haven't been sent
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Server error',
          message: error.message
        }));
      }
      
      reject(error);
    }
  });
}