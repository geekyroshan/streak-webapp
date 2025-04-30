import { VercelRequest, VercelResponse } from '@vercel/node';
import { githubCallback } from '../controllers/auth.controller';

// Handle CORS
const allowCors = (fn: (req: VercelRequest, res: VercelResponse) => Promise<any>) => async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return await fn(req, res);
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method === 'GET') {
    return githubCallback(req, res, (err: any) => {
      if (err) {
        console.error('Error in callback:', err);
        return res.status(err.statusCode || 500).json({
          message: err.message
        });
      }
    });
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
};

export default allowCors(handler); 