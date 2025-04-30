import { Request, Response } from 'express';
import { getGithubProfile } from '../controllers/github.controller';
import { protect } from '../middleware/auth.middleware';

/**
 * API handler for getting GitHub profile
 * Route: /api/github/profile
 */
export default async function handler(req: Request, res: Response) {
  console.log('[API Handler] GitHub Profile handler called');
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  try {
    // Run auth middleware first
    await new Promise<void>((resolve, reject) => {
      protect(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Then call the controller
    return getGithubProfile(req, res, (err) => {
      if (err) {
        console.error('Error in getGithubProfile:', err);
        return res.status(err.statusCode || 500).json({
          status: 'error',
          message: err.message
        });
      }
    });
  } catch (error) {
    console.error('[API Handler] Error:', error);
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Authentication failed'
    });
  }
} 