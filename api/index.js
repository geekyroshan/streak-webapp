// API root handler for Vercel
module.exports = async (req, res) => {
  // Log request details for debugging
  console.log('=================== API INDEX DEBUG ===================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request path:', req.url.split('?')[0]);
  console.log('Request query:', req.url.includes('?') ? req.url.split('?')[1] : 'none');
  console.log('Request headers:', JSON.stringify(req.headers));
  console.log('Vercel environment:', process.env.VERCEL ? 'Yes' : 'No');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - responding with 200');
    console.log('=================== END DEBUG ===================');
    return res.status(200).end();
  }
  
  try {
    // Special case for direct hits to index.js - this should be rare
    if (req.url === '/api' || req.url === '/api/') {
      console.log('Direct hit to API root');
      console.log('=================== END DEBUG ===================');
      return res.status(200).json({
        status: 'success',
        message: 'API is working',
        routes: {
          github_login: '/api/github-login',
          github_callback: '/api/auth/github/callback'
        },
        timestamp: new Date().toISOString(),
        debug: {
          handler: 'api/index.js',
          url: req.url,
          method: req.method
        }
      });
    }
    
    // If this is a GitHub auth request (should be handled by other routes)
    if (req.url.includes('/github-login') || req.url.includes('/auth/github')) {
      console.log('WARNING: GitHub auth request hit index.js fallback handler - routing problem detected');
      console.log('This indicates a Vercel routing configuration issue or missing destination file');
      console.log('Route requested:', req.url);
      
      // Get GitHub Client ID 
      const githubClientId = process.env.GITHUB_CLIENT_ID;
      console.log('GitHub Client ID available:', !!githubClientId);
      
      if (!githubClientId) {
        console.error('ERROR: GitHub Client ID is not configured');
        console.log('=================== END DEBUG ===================');
        return res.status(500).json({
          error: 'Configuration Error',
          message: 'GitHub OAuth credentials are not properly configured',
          debug: {
            handler: 'api/index.js',
            url: req.url,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Emergency fallback - send to GitHub OAuth directly
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=user,repo`;
      console.log('Emergency redirect to GitHub:', githubAuthUrl);
      console.log('=================== END DEBUG ===================');
      
      res.writeHead(302, { 
        'Location': githubAuthUrl,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      return res.end();
    }
    
    // Unknown API route
    console.log('Unknown API route requested');
    console.log('=================== END DEBUG ===================');
    return res.status(404).json({
      status: 'error',
      message: `API route not found: ${req.url}`,
      timestamp: new Date().toISOString(),
      debug: {
        handler: 'api/index.js',
        availableRoutes: ['/api', '/api/github-login', '/api/auth/github/callback'],
        requestedRoute: req.url
      }
    });
  } catch (error) {
    console.error('ERROR in API handler:', error);
    console.error('Error stack:', error.stack);
    console.log('=================== END DEBUG ===================');
    
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error',
      debug: {
        handler: 'api/index.js',
        url: req.url,
        timestamp: new Date().toISOString()
      }
    });
  }
}; 