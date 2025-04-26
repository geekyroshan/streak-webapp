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
    
    // Set token in cookie and redirect to frontend
    const token = tokenData.access_token;
    
    // Get the domain for setting the cookie
    const domain = req.headers.host && req.headers.host.includes('vercel.app') 
      ? '.vercel.app' 
      : req.headers.host;
    
    // Set multiple cookies with various settings to ensure one works
    const cookieOptions = [
      // Standard cookie with domain
      `github_token=${token}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`,
      
      // Cookie without domain restriction
      `github_token_alt=${token}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`,
      
      // Cookie without HttpOnly for client access
      `github_token_client=${token}; Path=/; Max-Age=2592000; SameSite=Lax`
    ];
    
    // Set multiple cookies to ensure at least one works
    res.setHeader('Set-Cookie', cookieOptions);
    
    // Also store token in localStorage via redirect
    const dashboardUrl = `/dashboard?token=${token}`;
    
    // Redirect to the dashboard with token
    res.writeHead(302, { 'Location': dashboardUrl });
    return res.end();
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during GitHub authentication',
      details: error.message
    });
  }
} 