// This is a simple Express-like fallback server 
// to use when the TypeScript build fails

const createFallbackServer = () => {
  // Simple request handler that mimics Express functionality
  return (req, res) => {
    // Parse the URL to determine the route
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    
    console.log(`[Fallback Server] ${req.method} ${path}`);
    
    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    
    // Handle different routes
    if (path === '/api/health' || path === '/api/health/') {
      // Health check endpoint
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'healthy',
        message: 'Fallback API is running',
        serverTime: new Date().toISOString(),
        serverlessMode: true,
        environment: process.env.NODE_ENV || 'development'
      }));
      return;
    }
    
    if (path === '/api' || path === '/api/') {
      // API info endpoint
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'online',
        message: 'Fallback GitHub Streak Manager API',
        version: process.env.API_VERSION || '1.0.0 (Fallback)',
        serverTime: new Date().toISOString(),
        note: 'Running in fallback mode due to build issues'
      }));
      return;
    }
    
    if (path.startsWith('/api/auth/github')) {
      // GitHub auth endpoint - redirect to GitHub
      const githubClientId = process.env.GITHUB_CLIENT_ID;
      const redirectUri = encodeURIComponent(process.env.GITHUB_REDIRECT_URI || 
        `https://${req.headers.host}/api/auth/github/callback`);
      
      if (!githubClientId) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({
          error: 'Configuration error',
          message: 'GitHub OAuth credentials not configured'
        }));
        return;
      }
      
      // Redirect to GitHub OAuth
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=user%20repo`;
      res.statusCode = 302;
      res.setHeader('Location', authUrl);
      res.end();
      return;
    }
    
    // Default response for unhandled routes
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 404;
    res.end(JSON.stringify({
      error: 'Not found',
      message: `Route '${path}' not implemented in fallback server`,
      serverlessMode: true,
      fallbackMode: true
    }));
  };
};

export default createFallbackServer; 