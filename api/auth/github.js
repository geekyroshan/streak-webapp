// api/auth/github.js - GitHub OAuth initial authentication
import { createServerHandler } from '../server-adapter';
import { createLogger } from '../utils/logging';

// Create a logger for this module
const logger = createLogger('Auth:GitHub');

// Create a handler that delegates to the Express server
const handler = createServerHandler();

export default async function githubAuthHandler(req, res) {
  logger.info('GitHub Auth request:', req.url);
  
  try {
    // Add a prefix to the URL so it routes correctly to the Express handler
    req.url = `/api/auth/github`;
    logger.info('Forwarding to:', req.url);
    
    // Forward to the Express handler
    return await handler(req, res);
  } catch (error) {
    logger.error('Error in GitHub auth:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
} 