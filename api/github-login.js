// Direct GitHub OAuth handler for Vercel
module.exports = (req, res) => {
  try {
    console.log('=================== GITHUB LOGIN DEBUG ===================');
    console.log('Endpoint: /api/github-login.js');
    console.log('Timestamp:', new Date().toISOString());
    
    // HARDCODED GitHub Client ID - DO NOT DO THIS IN PRODUCTION NORMALLY
    // But since the GitHub Client ID is a public value (not a secret) and we're
    // having issues with environment variables, we'll use it directly for now
    const githubClientId = 'Ov23liZPhqlr3PBuhGK8';
    
    console.log('Using hardcoded GitHub Client ID');
    
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