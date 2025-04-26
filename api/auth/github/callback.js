// GitHub OAuth callback handler
export default async function handler(req, res) {
  try {
    const code = req.query.code;
    
    // If no code is present, return an error
    if (!code) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No authorization code received from GitHub'
      });
    }
    
    // GitHub OAuth credentials
    const clientId = 'Ov23liZPhqlr3PBuhGK8';
    const clientSecret = '91272c70b4681774fd3a662519034dd660b34cc6';
    
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
      return res.status(400).json({
        error: 'Authentication Error',
        message: tokenData.error_description || 'Failed to authenticate with GitHub',
        details: tokenData
      });
    }
    
    // Get the token
    const token = tokenData.access_token;
    
    // Redirect to the frontend dashboard with the token
    const redirectUrl = `/dashboard?token=${token}`;
    res.writeHead(302, { 
      'Location': redirectUrl,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    return res.end();
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during GitHub authentication',
      details: error.message
    });
  }
} 