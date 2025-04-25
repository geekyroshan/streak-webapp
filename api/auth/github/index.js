// GitHub OAuth handler using directory-based routing
module.exports = (req, res) => {
  console.log('[api/auth/github/index.js] Handler called');
  
  try {
    // Get GitHub Client ID from environment variable
    const githubClientId = process.env.GITHUB_CLIENT_ID;
    
    // If GitHub Client ID is not set, provide useful error
    if (!githubClientId) {
      console.error('GitHub Client ID environment variable is missing');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'GitHub OAuth client ID is not configured in environment variables'
      });
    }
    
    // Construct GitHub OAuth URL
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=user,repo`;
    
    console.log('Redirecting to:', githubAuthUrl);
    
    // Send redirect
    res.statusCode = 302;
    res.setHeader('Location', githubAuthUrl);
    res.end();
  } catch (error) {
    console.error('Error in GitHub OAuth route:', error);
    
    res.status(500).json({
      error: 'Server Error',
      message: error.message || 'An unknown error occurred'
    });
  }
}; 