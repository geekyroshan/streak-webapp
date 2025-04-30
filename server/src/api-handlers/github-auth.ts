// Import the controller
import { githubAuth } from '../controllers/auth.controller';
import { Request, Response } from 'express';

// Simple wrapper for Vercel serverless function
export default function handler(req: Request, res: Response) {
  console.log('[Serverless] GitHub Auth Handler called');
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Call the controller directly
  return githubAuth(req, res);
} 