// This file serves as an adapter for Vercel serverless functions
// It routes all requests to our Express application

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Import our Express app
const app = require('../server/dist/index.js');

const isLocalHost = (req) => {
  const host = req.headers.host || '';
  return host.includes('localhost') || host.includes('127.0.0.1');
};

export default async function handler(req, res) {
  try {
    // Set CORS headers for local development
    if (isLocalHost(req)) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
      );
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
    }

    // Forward the request to our Express app
    await new Promise((resolve, reject) => {
      app.default(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  } catch (error) {
    console.error('Error in API route handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
} 