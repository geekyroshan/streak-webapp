// Simplified API Handler for Vercel
import express from 'express';
import { createServer } from 'http';

// This is the single handler for all API routes
export default function handler(req, res) {
  console.log(`[API] Request: ${req.method} ${req.url}`);
  
  // For now, redirect GitHub auth requests directly to GitHub
  if (req.url.includes('/api/auth/github') && !req.url.includes('/callback')) {
    console.log('Handling GitHub auth request');
    
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI || 'https://github-streak-manager.vercel.app/api/auth/github/callback';
    
    // Generate authorization URL
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user%20repo&allow_signup=false&prompt=login`;
    
    console.log('Redirecting to GitHub:', githubAuthUrl);
    return res.redirect(302, githubAuthUrl);
  }
  
  // For other requests, show API status
  return res.status(200).json({
    status: 'online',
    message: 'GitHub Streak Manager API',
    endpoints: {
      github_auth: '/api/auth/github',
      health: '/api/health'
    },
    note: "Server is being reconfigured for Vercel deployment"
  });
} 