// Catchall handler for remaining API routes
import app from '../server/dist/index.js';

export default function handler(req, res) {
  console.log('[API Catchall] Request received:', req.method, req.url);
  
  // Forward the request to Express app
  return new Promise((resolve, reject) => {
    // Handle the request with the app
    app(req, res);
    
    // Listen for completion
    res.on('finish', () => {
      console.log('[API Catchall] Response finished');
      resolve();
    });
    
    // Listen for errors
    res.on('error', (error) => {
      console.error('[API Catchall] Response error:', error);
      reject(error);
    });
  });
} 