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
    console.log('Headers:', req.headers);
    
    // GitHub auth redirect handling
    if (req.url.includes('/api/auth/github')) {
      const githubClientId = process.env.GITHUB_CLIENT_ID;
      if (!githubClientId) {
        throw new Error('GitHub Client ID not configured');
      }
      
      const host = req.headers.host || 'localhost';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const redirectUri = process.env.GITHUB_REDIRECT_URI || 
        `${protocol}://${host}/api/auth/github/callback`;
      
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user,repo`;
      
      console.log('Redirecting to GitHub:', githubAuthUrl);
      return res.redirect(302, githubAuthUrl);
    }
    
    // Default response for other routes
    return res.status(200).json({
      status: 'success',
      message: 'Simplified API is working',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      route: req.url
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
}; 