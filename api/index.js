// api/index.js - Main API entry point and documentation
import { createLogger } from './utils/logging';

// Create a logger for this module
const logger = createLogger('API');

/**
 * Main API handler
 * 
 * This serves as both:
 * 1. A unified entry point for the API
 * 2. Documentation for available endpoints
 * 3. A status endpoint showing API health
 * 
 * This endpoint is hit when a user visits /api directly.
 */
export default function handler(req, res) {
  logger.info(`Root API request: ${req.method} ${req.url}`);
  
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
        callback: '/api/auth/github-callback',
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
    structure: "Organized into category-based subdirectories: auth/, github/, streaks/, contributions/"
  });
} 