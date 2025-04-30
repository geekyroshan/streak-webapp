// api/utils/env-check.js - Debug environment variables
import { createLogger } from './logging';

const logger = createLogger('EnvCheck');

// Check for important environment variables and log their presence
export function checkEnvironment() {
  const envVars = {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? '[REDACTED]' : undefined,
    GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI,
    JWT_SECRET: process.env.JWT_SECRET ? '[REDACTED]' : undefined,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    CLIENT_URL: process.env.CLIENT_URL
  };

  logger.info('Environment Variables Check:');
  for (const [key, value] of Object.entries(envVars)) {
    logger.info(`${key}: ${value ? (value === '[REDACTED]' ? value : value) : 'NOT SET'}`);
  }
  
  return envVars;
}

// Export a function that can be called directly in API routes for debugging
export default function checkEnvHandler(req, res) {
  logger.info('Environment check endpoint called');
  
  // Check environment but don't expose secrets
  const envStatus = Object.entries(checkEnvironment())
    .reduce((acc, [key, value]) => {
      acc[key] = value ? (value === '[REDACTED]' ? 'SET' : value) : 'NOT SET';
      return acc;
    }, {});
  
  return res.status(200).json({
    status: 'success',
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
    variables: envStatus
  });
} 