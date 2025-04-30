// This file creates a bridge between Vercel's serverless functions and your Express app
import express from 'express';
import { createServer } from 'http';
import { parse } from 'url';
import app from '../server/dist/index.js';
import { createLogger } from './utils/logging';

// Create a logger for this module
const logger = createLogger('ServerAdapter');

/**
 * Creates a handler that forwards requests to the Express app
 * 
 * This function returns a handler that can be used by individual API
 * endpoints to forward requests to the Express application with proper
 * error handling and URL rewriting.
 * 
 * @returns {Function} A handler function that forwards requests to Express
 */
export function createServerHandler() {
  return async (req, res) => {
    logger.info(`Request received: ${req.url}`);
    
    try {
      // Forward the request to your Express app
      await new Promise((resolve, reject) => {
        // Handle the request directly with the imported app
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
    } catch (error) {
      logger.error(`Error processing request to ${req.url}:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    }
  };
} 