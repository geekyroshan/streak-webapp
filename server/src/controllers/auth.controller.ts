import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getGitHubAccessToken, GitHubService } from '../services/github.service';
import User from '../models/user.model';
import { githubConfig } from '../config/github';
import AppError from '../utils/appError';

// Helper to create and send JWT
const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Create and send JWT as cookie
const createSendToken = (user: any, statusCode: number, req: Request, res: Response) => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '30') * 24 * 60 * 60 * 1000)
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  };

  // Set the cookie
  res.cookie('jwt', token, cookieOptions);
  
  // Remove password/sensitive info from output
  user.accessToken = undefined;
  user.refreshToken = undefined;
  
  // Redirect to the frontend dashboard with token in URL
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
  console.log(`Redirecting to frontend at: ${clientUrl}/dashboard`);
  res.redirect(`${clientUrl}/dashboard?token=${token}`);
};

// Initiate GitHub OAuth flow
export const githubAuth = (req: Request, res: Response) => {
  const authUrl = `${githubConfig.authUrl}?client_id=${githubConfig.clientId}&redirect_uri=${githubConfig.redirectUri}&scope=${githubConfig.scope}`;
  
  // Debug the URL
  console.log('GitHub Auth URL:', authUrl);
  
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
    const { code } = req.query;
    
    if (!code) {
      return next(new AppError('No authorization code provided', 400));
    }
    
    // Exchange code for token
    const accessToken = await getGitHubAccessToken(code as string);
    
    if (!accessToken) {
      return next(new AppError('Failed to get access token', 400));
    }
    
    // Get user info from GitHub
    const githubService = new GitHubService(accessToken);
    const githubUser = await githubService.getUserProfile();
    
    // Check if user exists in our database
    let user = await User.findOne({ githubId: githubUser.id });
    
    if (user) {
      // Update existing user
      user.accessToken = accessToken;
      user.lastLogin = new Date();
      user.name = githubUser.name || githubUser.login;
      user.email = githubUser.email;
      user.avatar = githubUser.avatar_url;
      await user.save();
    } else {
      // Create new user
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
    createSendToken(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// Log out user
export const logout = (req: Request, res: Response) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
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