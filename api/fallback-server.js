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
    
    // Debug environment variables for GitHub OAuth
    console.log('[Fallback Server] GitHub OAuth Debug:');
    console.log('- Client ID:', process.env.GITHUB_CLIENT_ID ? 'Set' : 'Not set');
    console.log('- Client Secret:', process.env.GITHUB_CLIENT_SECRET ? 'Set' : 'Not set');
    console.log('- Redirect URI:', process.env.GITHUB_REDIRECT_URI || 'Not set');
    console.log('- Vercel URL:', process.env.VERCEL_URL || 'Not set');
    
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
      
      // Construct redirect URI
      let redirectUri = process.env.GITHUB_REDIRECT_URI;
      if (!redirectUri) {
        // Auto-construct from host if not provided
        const host = req.headers.host || (process.env.VERCEL_URL ? process.env.VERCEL_URL : 'localhost');
        const protocol = host.includes('localhost') ? 'http' : 'https';
        redirectUri = `${protocol}://${host}/api/auth/github/callback`;
      }
      
      console.log('[Fallback Server] Using GitHub redirect URI:', redirectUri);
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      
      if (!githubClientId) {
        console.error('[Fallback Server] GitHub Client ID not configured!');
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({
          error: 'Configuration error',
          message: 'GitHub OAuth credentials not configured - missing GITHUB_CLIENT_ID',
          documentation: 'Please set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET and GITHUB_REDIRECT_URI environment variables'
        }));
        return;
      }
      
      // Redirect to GitHub OAuth
      const scope = 'user repo';
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodedRedirectUri}&scope=${scope}`;
      
      console.log('[Fallback Server] Redirecting to GitHub OAuth:', authUrl);
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