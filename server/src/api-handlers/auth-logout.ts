// Import the controller
import { logout } from '../controllers/auth.controller';
import { Request, Response } from 'express';

// Simple wrapper for Vercel serverless function
export default function handler(req: Request, res: Response) {
  console.log('[Serverless] Auth Logout Handler called');
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Call the controller directly
  return logout(req, res);
} 