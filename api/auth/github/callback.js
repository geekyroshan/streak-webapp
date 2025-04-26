// GitHub OAuth callback handler for Vercel
module.exports = async (req, res) => {
  console.log('=================== GITHUB CALLBACK DEBUG ===================');
  console.log('Endpoint: /api/auth/github/callback.js');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request query:', req.query ? JSON.stringify(req.query) : 'none');
  console.log('Request headers:', JSON.stringify(req.headers));
  
  try {
    const code = req.query.code;
    console.log('GitHub authorization code received:', code ? 'Yes (length: ' + code.length + ')' : 'No');
    
    if (!code) {
      console.error('ERROR: No authorization code received from GitHub');
      console.log('=================== END DEBUG ===================');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No authorization code received from GitHub'
      });
    }
    
    // Get GitHub OAuth credentials from environment variables
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    console.log('GitHub Client ID available:', !!clientId);
    console.log('GitHub Client Secret available:', !!clientSecret);
    
    if (!clientId || !clientSecret) {
      console.error('ERROR: GitHub OAuth credentials not configured');
      console.log('=================== END DEBUG ===================');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'GitHub OAuth credentials not properly configured'
      });
    }
    
    // Exchange code for an access token
    console.log('Exchanging code for access token...');
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
    console.log('Token response received:', tokenData.access_token ? 'Success' : 'Failed');
    
    if (tokenData.error || !tokenData.access_token) {
      console.error('ERROR exchanging code for token:', tokenData.error_description || tokenData.error);
      console.log('=================== END DEBUG ===================');
      return res.status(400).json({
        error: 'Authentication Error',
        message: tokenData.error_description || 'Failed to authenticate with GitHub'
      });
    }
    
    // Set token in cookie and redirect to frontend
    const token = tokenData.access_token;
    console.log('Access token received, setting cookie and redirecting to dashboard');
    
    // Set token in cookies
    res.setHeader('Set-Cookie', `github_token=${token}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`);
    
    console.log('Authentication successful, redirecting to dashboard...');
    console.log('=================== END DEBUG ===================');
    
    // Redirect to the dashboard
    res.statusCode = 302;
    res.setHeader('Location', '/dashboard');
    return res.end();
  } catch (error) {
    console.error('ERROR in GitHub OAuth callback:', error);
    console.error('Error stack:', error.stack);
    console.log('=================== END DEBUG ===================');
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during GitHub authentication',
      timestamp: new Date().toISOString()
    });
  }
}; 