import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getGitHubAccessToken, GitHubService } from '../services/github.service';
import User from '../models/user.model';
import { githubConfig } from '../config/github';
import AppError from '../utils/appError';

// Helper to create and send JWT
const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

// Create and send JWT as cookie
const createSendToken = (user: any, statusCode: number, req: Request, res: Response) => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '1') * 24 * 60 * 60 * 1000)
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  };

  // Set the cookie
  res.cookie('jwt', token, cookieOptions);
  
  // Remove password/sensitive info from output
  user.accessToken = undefined;
  user.refreshToken = undefined;
  
  // Redirect to the frontend dashboard WITHOUT token in URL
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
  console.log(`Redirecting to frontend at: ${clientUrl}/dashboard`);
  res.redirect(`${clientUrl}/dashboard`);
};

// Initiate GitHub OAuth flow
export const githubAuth = (req: Request, res: Response) => {
  // Force new login by adding random state parameter to prevent caching
  const randomState = `st_${Math.random().toString(36).substring(2, 15)}`;
  
  const authUrl = `${githubConfig.authUrl}?client_id=${githubConfig.clientId}&redirect_uri=${githubConfig.redirectUri}&scope=${githubConfig.scope}&allow_signup=false&prompt=login&state=${randomState}`;
  
  // Debug the URL and request info
  console.log('GitHub Auth Request Details:');
  console.log('Full Auth URL:', authUrl);
  console.log('Request cookies:', req.cookies);
  console.log('Request headers:', req.headers);
  
  // Check if client ID is present
  if (!githubConfig.clientId) {
    return res.status(500).json({ 
      status: 'error',
      message: 'GitHub OAuth not configured properly. Missing client ID.'
    });
  }
  
  res.redirect(authUrl);
};

// Handle GitHub OAuth callback
export const githubCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('GitHub Callback Request Details:');
    console.log('Query parameters:', req.query);
    console.log('Cookies:', req.cookies);
    console.log('Headers:', req.headers);
    
    const { code, state } = req.query;
    
    if (!code) {
      return next(new AppError('No authorization code provided', 400));
    }
    
    // Exchange code for token
    console.log('Exchanging code for token...');
    const accessToken = await getGitHubAccessToken(code as string);
    
    if (!accessToken) {
      return next(new AppError('Failed to get access token', 400));
    }
    
    console.log('Successfully received access token');
    
    // Get user info from GitHub
    const githubService = new GitHubService(accessToken);
    const githubUser = await githubService.getUserProfile();
    console.log('GitHub user details retrieved:', githubUser.login);
    
    // Check if user exists in our database
    let user = await User.findOne({ githubId: githubUser.id });
    
    if (user) {
      // Update existing user
      console.log('Updating existing user:', user.username);
      user.accessToken = accessToken;
      user.lastLogin = new Date();
      user.name = githubUser.name || githubUser.login;
      user.email = githubUser.email;
      user.avatar = githubUser.avatar_url;
      await user.save();
    } else {
      // Create new user
      console.log('Creating new user for:', githubUser.login);
      user = await User.create({
        githubId: githubUser.id,
        username: githubUser.login,
        name: githubUser.name || githubUser.login,
        email: githubUser.email,
        avatar: githubUser.avatar_url,
        accessToken
      });
    }
    
    // Send token to client
    console.log('Creating and sending JWT token to client');
    createSendToken(user, 200, req, res);
  } catch (error) {
    console.error('Error in GitHub callback:', error);
    next(error);
  }
};

// Log out user
export const logout = (req: Request, res: Response) => {
  console.log('Logout Request Details:');
  console.log('Cookies before logout:', req.cookies);
  console.log('Headers:', req.headers);
  
  // Clear the JWT cookie with secure options and immediate expiration
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() - 10000), // Set to past date for immediate expiration
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'strict',
    path: '/'
  });
  
  console.log('JWT cookie cleared');
  
  res.status(200).json({ status: 'success' });
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // User should be attached by auth middleware
    const user = req.user;
    
    if (!user) {
      return next(new AppError('Not logged in', 401));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
}; 