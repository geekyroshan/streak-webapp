// Direct GitHub OAuth handler for Vercel
module.exports = async (req, res) => {
  console.log('GitHub OAuth route hit directly:', req.url);
  
  try {
    // Get GitHub Client ID from environment variable
    const githubClientId = process.env.GITHUB_CLIENT_ID;
    
    // If GitHub Client ID is not set, return an error
    if (!githubClientId) {
      console.error('GitHub Client ID is not configured');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'GitHub OAuth client ID is not configured'
      });
    }
    
    // Construct GitHub OAuth URL - remove callback URL for simplicity
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=user,repo`;
    
    console.log('Redirecting to GitHub:', githubAuthUrl);
    
    // Use direct response setting for redirect
    res.statusCode = 302;
    res.setHeader('Location', githubAuthUrl);
    return res.end();
  } catch (error) {
    console.error('Error in GitHub OAuth route:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Unknown error occurred'
    });
  }
}; 