// api/index.js - Main API entry point and documentation
import { createServerHandler } from './server-adapter';
import { createLogger } from './utils/logging';

// Create a logger for this module
const logger = createLogger('API');

// Configure the routes for this serverless function
const configureRoutes = (app) => {
  app.get('/api', (req, res) => {
    // Status endpoint - show API information
    return res.status(200).json({
      status: 'online',
      message: 'GitHub Streak Manager API',
      version: process.env.API_VERSION || '1.0.0',
      serverTime: new Date().toISOString(),
      endpoints: {
        // Auth endpoints
        auth: {
          github: '/api/auth/github',
          callback: '/api/auth/github/callback',
          logout: '/api/auth/logout',
          me: '/api/auth/me'
        },
        // GitHub endpoints
        github: {
          profile: '/api/github/profile',
          repositories: '/api/github/repositories',
          activities: '/api/github/activities',
          user: '/api/github/user'
        },
        // Streak endpoints
        streaks: {
          get: '/api/streaks/get',
          create: '/api/streaks/create',
          update: '/api/streaks/update'
        },
        // Contributions endpoints
        contributions: {
          index: '/api/contributions',
          stats: '/api/contributions/stats'
        },
        // Utility endpoints
        health: '/api/health'
      },
      serverless: true,
      structure: "Organized into category-based endpoints under /api"
    });
  });
};

// Create a handler that configures and uses the Express app
const handler = createServerHandler(configureRoutes);

export default async function apiIndexHandler(req, res) {
  logger.info(`API root request: ${req.method} ${req.url}`);
  
  try {
    // Pass the request to our handler
    return await handler(req, res);
  } catch (error) {
    logger.error('Error in API root handler:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
} 