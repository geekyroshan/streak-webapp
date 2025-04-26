// GitHub OAuth callback handler
export default async function handler(req, res) {
  try {
    console.log('GitHub OAuth callback received');
    const code = req.query.code;
    
    // If no code is present, return an error
    if (!code) {
      console.error('No authorization code received');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No authorization code received from GitHub'
      });
    }
    
    console.log('Received code from GitHub:', code.substring(0, 5) + '...');
    
    // GitHub OAuth credentials
    const clientId = 'Ov23liZPhqlr3PBuhGK8';
    const clientSecret = '91272c70b4681774fd3a662519034dd660b34cc6';
    
    // Exchange code for an access token
    console.log('Exchanging code for token...');
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
      console.error('Failed to get token:', tokenData);
      return res.status(400).json({
        error: 'Authentication Error',
        message: tokenData.error_description || 'Failed to authenticate with GitHub',
        details: tokenData
      });
    }
    
    // Get the token
    const token = tokenData.access_token;
    console.log('Successfully received token:', token.substring(0, 5) + '...');
    
    // Redirect to the frontend dashboard with the token
    const redirectUrl = `/dashboard?token=${token}`;
    console.log('Redirecting to:', redirectUrl);
    
    res.writeHead(302, { 
      'Location': redirectUrl,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    return res.end();
  } catch (error) {
    console.error('Error in GitHub callback:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during GitHub authentication',
      details: error.message
    });
  }
} 