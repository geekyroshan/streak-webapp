// Consolidated API router for Vercel
import express from 'express';
import { createServer } from 'http';
import app from '../server/dist/index.js';

export default function handler(req, res) {
  console.log('[API Router] Request received:', req.method, req.url);
  
  // Forward the request to Express app
  return new Promise((resolve, reject) => {
    // Handle the request with the app
    app(req, res);
    
    // Listen for completion
    res.on('finish', () => {
      console.log('[API Router] Response finished');
      resolve();
    });
    
    // Listen for errors
    res.on('error', (error) => {
      console.error('[API Router] Response error:', error);
      reject(error);
    });
  });
}