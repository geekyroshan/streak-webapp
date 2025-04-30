// api/streaks/create.js - Create new streak endpoint
import { createServerHandler } from '../server-adapter';
import { createLogger } from '../utils/logging';
import { getSession } from '../utils/auth';

// Create a logger for this module
const logger = createLogger('Streaks:Create');

// Create a handler that delegates to the Express server
const handler = createServerHandler();

export default async function createStreakHandler(req, res) {
  logger.info('Create streak request');
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get user session
  const session = getSession(req);
  
  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Add a prefix to the URL so it routes correctly to the Express handler
    req.url = `/api/streaks/create`;
    logger.info('Forwarding to:', req.url);
    
    // Forward to the Express handler
    return await handler(req, res);
  } catch (error) {
    logger.error('Error in create streak endpoint:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
} 