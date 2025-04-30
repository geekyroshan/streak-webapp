// api/utils/auth.js - Authentication utilities
import { parse, serialize } from 'cookie';
import { createLogger } from './logging.js';

const logger = createLogger('Auth');

/**
 * Get the user session from cookies
 * @param {Object} req - The request object
 * @returns {Object|null} The user session or null if not authenticated
 */
export function getSession(req) {
  const cookies = parse(req.headers.cookie || '');
  const sessionCookie = cookies.github_session;
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie);
  } catch (error) {
    console.error('[Auth Utils] Error parsing session cookie:', error);
    return null;
  }
}

/**
 * Check if the user is authenticated
 * @param {Object} req - The request object
 * @returns {boolean} True if authenticated, false otherwise
 */
export function isAuthenticated(req) {
  return getSession(req) !== null;
}

/**
 * Set a session cookie
 * @param {Object} res - The response object
 * @param {Object} session - The session data to serialize
 * @param {Object} options - Cookie options
 */
export function setSessionCookie(res, session, options = {}) {
  const defaultOptions = {
    path: '/',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: 'lax', 
    secure: process.env.NODE_ENV === 'production'
    // Don't set domain for cross-domain cookies on Vercel
  };
  
  const cookieOptions = { ...defaultOptions, ...options };
  
  // Log the cookie options for debugging
  console.log('Setting cookie with options:', cookieOptions);
  
  res.setHeader(
    'Set-Cookie', 
    serialize('github_session', JSON.stringify(session), cookieOptions)
  );
}

/**
 * Handle GitHub OAuth flow
 */
export async function handleGitHubAuth(req, res) {
  logger.info('Handling GitHub auth request');
  
  try {
    // Get GitHub OAuth credentials
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    // Determine redirect URI
    let redirectUri = process.env.GITHUB_REDIRECT_URI;
    if (!redirectUri) {
      // Auto-construct from host
      const host = req.headers.host || process.env.VERCEL_URL || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      redirectUri = `${protocol}://${host}/api/auth/github/callback`;
    }
    
    logger.info(`Using redirect URI: ${redirectUri}`);
    
    // Check if required credentials are available
    if (!clientId) {
      logger.error('GitHub Client ID not configured');
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Configuration error',
        message: 'GitHub OAuth credentials not configured',
        details: 'Missing GITHUB_CLIENT_ID environment variable'
      }));
      return;
    }
    
    // Prepare GitHub OAuth URL
    const scope = 'user repo';
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    
    logger.info(`Redirecting to GitHub: ${authUrl}`);
    
    // Redirect to GitHub
    res.statusCode = 302;
    res.setHeader('Location', authUrl);
    res.end();
  } catch (error) {
    logger.error('Error handling GitHub auth:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Server error',
      message: error.message || 'An error occurred during GitHub authentication'
    }));
  }
}

/**
 * Handle GitHub OAuth callback
 */
export async function handleGitHubCallback(req, res) {
  logger.info('Handling GitHub callback');
  
  try {
    const code = req.query.code;
    
    if (!code) {
      logger.error('No code received from GitHub');
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Bad request',
        message: 'No authorization code received from GitHub'
      }));
      return;
    }
    
    // Get GitHub OAuth credentials
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      logger.error('GitHub OAuth credentials not configured');
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Configuration error',
        message: 'GitHub OAuth credentials not configured',
        details: 'Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET environment variables'
      }));
      return;
    }
    
    logger.info('Exchanging code for access token');
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      logger.error('Failed to get access token from GitHub', tokenData);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Authentication error',
        message: 'Failed to exchange code for access token'
      }));
      return;
    }
    
    // Get user data from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'User-Agent': 'GitHub-Streak-Manager'
      }
    });
    
    const githubUser = await userResponse.json();
    
    // Create a session
    const session = {
      token: tokenData.access_token,
      user: {
        id: githubUser.id,
        username: githubUser.login,
        name: githubUser.name,
        avatar: githubUser.avatar_url
      }
    };
    
    // Set the session cookie
    setSessionCookie(res, session);
    
    // Redirect to dashboard
    const frontendUrl = process.env.FRONTEND_URL || '/';
    res.statusCode = 302;
    res.setHeader('Location', `${frontendUrl}/dashboard`);
    res.end();
  } catch (error) {
    logger.error('Error handling GitHub callback:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Server error',
      message: error.message || 'An error occurred during GitHub authentication callback'
    }));
  }
} 