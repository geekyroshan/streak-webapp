// Import the controller
import { getCurrentUser } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { Request, Response } from 'express';

// Simple wrapper for Vercel serverless function
export default async function handler(req: Request, res: Response) {
  console.log('[Serverless] Auth Me Handler called');
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // First run the auth middleware, then the controller
  try {
    await new Promise<void>((resolve, reject) => {
      protect(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Now call the controller
    return getCurrentUser(req, res, (err) => {
      if (err) {
        console.error('Error in getCurrentUser:', err);
        return res.status(err.statusCode || 500).json({
          status: 'error',
          message: err.message
        });
      }
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized'
    });
  }
} 