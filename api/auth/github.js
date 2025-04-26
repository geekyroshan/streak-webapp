// Direct GitHub OAuth handler for Vercel
module.exports = async (req, res) => {
  console.log('=================== GITHUB AUTH DEBUG ===================');
  console.log('Endpoint: /api/auth/github.js');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  try {
    // HARDCODED GitHub Client ID for consistency
    const githubClientId = 'Ov23liZPhqlr3PBuhGK8';
    console.log('Using hardcoded GitHub Client ID');
    
    // Construct GitHub OAuth URL
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=user,repo`;
    
    console.log('Redirecting to GitHub:', githubAuthUrl);
    console.log('=================== END DEBUG ===================');
    
    // Send redirect
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