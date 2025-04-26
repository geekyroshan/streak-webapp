// Direct GitHub OAuth handler for Vercel
module.exports = (req, res) => {
  // Enhanced debugging - log all details
  console.log('=================== GITHUB LOGIN DEBUG ===================');
  console.log('Endpoint: /api/github-login.js');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', JSON.stringify(req.headers));
  console.log('Environment variables available:', Object.keys(process.env).filter(key => !key.includes('SECRET')).join(', '));
  
  try {
    // Get GitHub Client ID from environment variable
    const githubClientId = process.env.GITHUB_CLIENT_ID;
    console.log('GitHub Client ID available:', !!githubClientId);
    
    if (!githubClientId) {
      console.error('ERROR: GitHub Client ID is not configured in environment variables');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'GitHub OAuth client ID is not configured'
      });
    }
    
    // Construct GitHub OAuth URL
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=user,repo`;
    
    console.log('Redirecting to GitHub:', githubAuthUrl);
    console.log('=================== END DEBUG ===================');
    
    // Send redirect response
    res.writeHead(302, { 
      'Location': githubAuthUrl,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    return res.end();
  } catch (error) {
    console.error('ERROR in GitHub OAuth route:', error);
    console.error('Error stack:', error.stack);
    console.log('=================== END DEBUG ===================');
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
}; 