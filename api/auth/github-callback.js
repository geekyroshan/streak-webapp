// api/auth/github-callback.js - Handle GitHub OAuth callback
import { createServerHandler } from '../server-adapter';
import { createLogger } from '../utils/logging';

// Create a logger for this module
const logger = createLogger('Auth:GitHub:Callback');

// Create a handler that delegates to the Express server
const handler = createServerHandler();

export default async function githubCallbackHandler(req, res) {
  logger.info('GitHub Callback request with code:', req.query.code ? 'present' : 'missing');
  
  try {
    // Add a prefix to the URL so it routes correctly to the Express handler
    req.url = `/api/auth/github/callback?${new URLSearchParams(req.query).toString()}`;
    logger.info('Forwarding to:', req.url);
    
    // Forward to the Express handler
    return await handler(req, res);
  } catch (error) {
    logger.error('Error in GitHub callback:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
} 