// Import dotenv to ensure environment variables are loaded
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug the environment variables
const clientId = process.env.GITHUB_CLIENT_ID || '';
const clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:5001/api/auth/github/callback';

console.log('GitHub Config values:');
console.log('Client ID (direct):', clientId);
console.log('Client Secret (masked):', clientSecret ? '****' : 'missing');
console.log('Redirect URI (direct):', redirectUri);

export const githubConfig = {
  clientId,
  clientSecret,
  redirectUri,
  scope: 'user repo',
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  apiUrl: 'https://api.github.com'
}; 