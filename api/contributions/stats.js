// api/contributions/stats.js - Contributions stats endpoint
import { createServerHandler } from '../server-adapter';

// Create a handler that delegates to the Express server
const handler = createServerHandler();

export default async function contributionsStatsHandler(req, res) {
  console.log('[API Proxy] Contributions Stats request:', req.url);
  
  try {
    // Add a prefix to the URL so it routes correctly to the Express handler
    req.url = `/api/contributions/stats${req.url.replace(/^\/api\/contributions\/stats/, '')}`;
    console.log('[API Proxy] Forwarding to:', req.url);
    
    // Forward to the Express handler
    return await handler(req, res);
  } catch (error) {
    console.error('[API Proxy] Error in contributions stats endpoint:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
} 