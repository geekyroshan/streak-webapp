// GitHub OAuth callback handler for Vercel
module.exports = async (req, res) => {
  console.log('GitHub OAuth callback hit:', req.url);
  
  try {
    const code = req.query.code;
    
    if (!code) {
      console.error('No authorization code received from GitHub');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No authorization code received from GitHub'
      });
    }
    
    // Get GitHub OAuth credentials from environment variables
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('GitHub OAuth credentials not configured');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'GitHub OAuth credentials not properly configured'
      });
    }
    
    // Exchange code for an access token
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
    
    if (tokenData.error || !tokenData.access_token) {
      console.error('Error exchanging code for token:', tokenData.error_description || tokenData.error);
      return res.status(400).json({
        error: 'Authentication Error',
        message: tokenData.error_description || 'Failed to authenticate with GitHub'
      });
    }
    
    // Set token in cookie and redirect to frontend
    const token = tokenData.access_token;
    
    // Set token in cookies
    res.setHeader('Set-Cookie', `github_token=${token}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`);
    
    console.log('Authentication successful, redirecting to dashboard...');
    
    // Redirect to the dashboard
    res.statusCode = 302;
    res.setHeader('Location', '/dashboard');
    return res.end();
  } catch (error) {
    console.error('Error in GitHub OAuth callback:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during GitHub authentication'
    });
  }
}; 