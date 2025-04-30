// Consolidated API router for Vercel
import express from 'express';
import { createServer } from 'http';
import app from '../server/dist/index.js';
import { createLogger } from './utils/logging';

// Create a logger for this module
const logger = createLogger('Router');

/**
 * Main API router
 * 
 * This handler serves as the primary entry point for API routes that
 * should be handled by the Express application. It forwards requests
 * directly to the Express app without any modification.
 * 
 * Use this for routes that already have corresponding handlers in the
 * TypeScript/Express application.
 */
export default function handler(req, res) {
  logger.info(`Request: ${req.method} ${req.url}`);
  
  // Forward the request to Express app
  return new Promise((resolve, reject) => {
    // Handle the request with the app
    app(req, res);
    
    // Listen for completion
    res.on('finish', () => {
      logger.info(`Response finished for ${req.url}`);
      resolve();
    });
    
    // Listen for errors
    res.on('error', (error) => {
      logger.error(`Response error for ${req.url}:`, error);
      reject(error);
    });
  });
}