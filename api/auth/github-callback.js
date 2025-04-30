// api/auth/github-callback.js - GitHub OAuth callback handler
import { createServerHandler } from '../server-adapter';
import { createLogger } from '../utils/logging';
import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';

// Create a logger for this module
const logger = createLogger('Auth:GitHubCallback');

// Configure GitHub OAuth settings from environment variables
const githubConfig = {
  clientId: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5001/api/auth/github/callback',
  scope: 'user repo',
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  apiUrl: 'https://api.github.com'
};

// Helper function to get GitHub access token
const getGitHubAccessToken = async (code) => {
  try {
    logger.info('Requesting access token from GitHub');
    
    const response = await axios.post(
      githubConfig.tokenUrl,
      {
        client_id: githubConfig.clientId,
        client_secret: githubConfig.clientSecret,
        code,
        redirect_uri: githubConfig.redirectUri
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );
    
    logger.info('Token response received');
    return response.data.access_token;
  } catch (error) {
    logger.error('Error getting GitHub access token:', error);
    throw error;
  }
};

// Helper function to get GitHub user profile
const getGitHubUserProfile = async (accessToken) => {
  try {
    logger.info('Fetching GitHub user profile');
    
    const response = await axios.get(`${githubConfig.apiUrl}/user`, {
      headers: {
        Authorization: `token ${accessToken}`
      }
    });
    
    logger.info('User profile received');
    return response.data;
  } catch (error) {
    logger.error('Error getting GitHub user profile:', error);
    throw error;
  }
};

// Configure the routes for this serverless function
const configureRoutes = (app) => {
  app.get('/api/auth/github/callback', async (req, res) => {
    try {
      logger.info('Received GitHub callback:', req.query);
      
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'No authorization code provided'
        });
      }
      
      // Exchange code for token
      const accessToken = await getGitHubAccessToken(code);
      
      if (!accessToken) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Failed to get access token'
        });
      }
      
      // Get user info from GitHub
      const githubUser = await getGitHubUserProfile(accessToken);
      
      // For demo purposes, we'll create a simple JWT
      // In a real app, you would verify if the user exists in your database
      const token = jwt.sign(
        { id: githubUser.id, username: githubUser.login },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );
      
      // Set cookie with the token
      const cookieOptions = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
        sameSite: 'lax'
      };
      
      res.cookie('jwt', token, cookieOptions);
      
      // Redirect to frontend
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${clientUrl}/dashboard`);
    } catch (error) {
      logger.error('Error in GitHub callback:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });
};

// Create a handler that configures and uses the Express app
const handler = createServerHandler(configureRoutes);

export default async function githubCallbackHandler(req, res) {
  logger.info('GitHub Callback request:', req.url);
  
  try {
    // Pass the request to our handler
    return await handler(req, res);
  } catch (error) {
    logger.error('Error in GitHub callback:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
} 