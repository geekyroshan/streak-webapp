// api/contributions/index.js - Contributions endpoint
import { createServerHandler } from '../server-adapter';

// Create a handler that delegates to the Express server
const handler = createServerHandler();

export default async function contributionsHandler(req, res) {
  console.log('[API Proxy] Contributions request:', req.url);
  
  try {
    // Add a prefix to the URL so it routes correctly to the Express handler
    req.url = `/api/contributions${req.url.replace(/^\/api\/contributions/, '')}`;
    console.log('[API Proxy] Forwarding to:', req.url);
    
    // Forward to the Express handler
    return await handler(req, res);
  } catch (error) {
    console.error('[API Proxy] Error in contributions endpoint:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
} 