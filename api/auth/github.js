// api/auth/github.js - GitHub OAuth initial authentication
import { createServerHandler } from '../server-adapter';
import { createLogger } from '../utils/logging';
import express from 'express';
import axios from 'axios';

// Create a logger for this module
const logger = createLogger('Auth:GitHub');

// Configure GitHub OAuth settings from environment variables
const githubConfig = {
  clientId: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5001/api/auth/github/callback',
  scope: 'user repo',
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token'
};

// Configure the routes for this serverless function
const configureRoutes = (app) => {
  app.get('/api/auth/github', (req, res) => {
    // Force new login by adding random state parameter to prevent caching
    const randomState = `st_${Math.random().toString(36).substring(2, 15)}`;
    
    const authUrl = `${githubConfig.authUrl}?client_id=${githubConfig.clientId}&redirect_uri=${githubConfig.redirectUri}&scope=${githubConfig.scope}&allow_signup=false&prompt=login&state=${randomState}`;
    
    // Debug the URL and request info
    logger.info('GitHub Auth Request Details:');
    logger.info('Full Auth URL:', authUrl);
    logger.info('Request cookies:', req.cookies);
    
    // Check if client ID is present
    if (!githubConfig.clientId) {
      return res.status(500).json({ 
        status: 'error',
        message: 'GitHub OAuth not configured properly. Missing client ID.'
      });
    }
    
    res.redirect(authUrl);
  });
};

// Create a handler that configures and uses the Express app
const handler = createServerHandler(configureRoutes);

export default async function githubAuthHandler(req, res) {
  logger.info('GitHub Auth request:', req.url);
  
  try {
    // Pass the request to our handler
    return await handler(req, res);
  } catch (error) {
    logger.error('Error in GitHub auth:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
} 