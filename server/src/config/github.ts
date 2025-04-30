// Import dotenv to ensure environment variables are loaded
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Determine the correct redirect URI
let redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:8080/api/auth/github/callback';

// In production, use the VERCEL_URL if available
if (process.env.NODE_ENV === 'production' && process.env.VERCEL_URL) {
  redirectUri = `https://${process.env.VERCEL_URL}/api/auth/github/callback`;
}

// If CLIENT_URL is set, use it as the base
if (process.env.CLIENT_URL) {
  try {
    // Only replace the host part, keeping the path
    const url = new URL(redirectUri);
    const clientUrl = new URL(process.env.CLIENT_URL);
    url.protocol = clientUrl.protocol;
    url.host = clientUrl.host;
    redirectUri = url.toString();
  } catch (error) {
    console.error('Error parsing URLs for redirect URI:', error);
  }
}

// Debug the environment variables
const clientId = process.env.GITHUB_CLIENT_ID || '';
const clientSecret = process.env.GITHUB_CLIENT_SECRET || '';

console.log('GitHub Config values:');
console.log('Client ID (direct):', clientId);
console.log('Client Secret (masked):', clientSecret ? '****' : 'missing');
console.log('Redirect URI (computed):', redirectUri);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Client URL:', process.env.CLIENT_URL || 'not set');
console.log('Vercel URL:', process.env.VERCEL_URL || 'not set');

export const githubConfig = {
  clientId,
  clientSecret,
  redirectUri,
  scope: 'user repo',
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  apiUrl: 'https://api.github.com'
}; 