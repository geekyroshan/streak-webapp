// Root API handler
import { createServerHandler } from './server-adapter';

// Export a handler that proxies to your Express app
export default function handler(req, res) {
  console.log('[API Root] Request received:', req.url);
  
  // For root API requests, return API status
  if (req.url === '/api' || req.url === '/api/') {
    return res.status(200).json({ 
      status: 'online',
      message: 'Streak Manager API is running',
      version: '1.0.0'
    });
  }
  
  // Otherwise use the server adapter
  return createServerHandler()(req, res);
} 