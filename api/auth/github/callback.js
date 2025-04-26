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
    
    try {
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
      
      // Check if fetch was successful
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`GitHub API responded with ${tokenResponse.status}: ${errorText}`);
      }
      
      // Parse the response as JSON
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
      
      // Set token in cookies
      res.setHeader('Set-Cookie', `github_token=${token}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`);
      
      // Redirect to the dashboard
      res.writeHead(302, { 'Location': '/dashboard' });
      return res.end();
    } catch (fetchError) {
      // Handle fetch-specific errors
      return res.status(502).json({
        error: 'GitHub API Error',
        message: 'Error communicating with GitHub',
        details: fetchError.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during GitHub authentication',
      details: error.message
    });
  }
} 