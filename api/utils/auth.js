// api/utils/auth.js - Authentication utilities
import { parse, serialize } from 'cookie';

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
  };
  
  const cookieOptions = { ...defaultOptions, ...options };
  
  res.setHeader(
    'Set-Cookie', 
    serialize('github_session', JSON.stringify(session), cookieOptions)
  );
} 