// Minimal handler for Vercel serverless function
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Log request details
    console.log(`Request received: ${req.method} ${req.url}`);
    
    // Check if this is a request to the GitHub auth endpoint
    if (req.url.includes('/api/auth/github')) {
      // Get GitHub Client ID from environment variable
      const githubClientId = process.env.GITHUB_CLIENT_ID;
      
      // If GitHub Client ID is not set, redirect to an error page
      if (!githubClientId) {
        console.error('GitHub Client ID is not configured in environment variables');
        return res.status(500).json({
          error: 'Configuration Error',
          message: 'GitHub OAuth credentials are not properly configured. Please contact the administrator.'
        });
      }
      
      // Construct the GitHub OAuth URL directly
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=user,repo`;
      
      console.log('Redirecting to GitHub OAuth:', githubAuthUrl);
      
      // Return a redirect response
      res.writeHead(302, { Location: githubAuthUrl });
      return res.end();
    }
    
    // Default response for other paths
    return res.status(200).json({
      status: 'success',
      message: 'API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error'
    });
  }
}; 