// api/github/repositories.js - GitHub repositories endpoint
import { createServerHandler } from '../server-adapter';

// Create a handler that delegates to the Express server
const handler = createServerHandler();

export default async function githubRepositoriesHandler(req, res) {
  console.log('[API Proxy] GitHub Repositories request:', req.url);
  
  try {
    // Add a prefix to the URL so it routes correctly to the Express handler
    req.url = `/api/github/repositories${req.url.replace(/^\/api\/github\/repositories/, '')}`;
    console.log('[API Proxy] Forwarding to:', req.url);
    
    // Forward to the Express handler
    return await handler(req, res);
  } catch (error) {
    console.error('[API Proxy] Error in GitHub repositories endpoint:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
} 