// api/auth/github-auth.js - GitHub Auth entry point (legacy redirect)
import { createLogger } from '../utils/logging';

// Create a logger for this module
const logger = createLogger('Auth:GitHubAuth:Legacy');

export default function githubAuthEntryHandler(req, res) {
  logger.info('Legacy GitHub Auth endpoint accessed - redirecting to /api/auth/github');
  
  // Redirect to the new endpoint
  res.redirect('/api/auth/github');
} 