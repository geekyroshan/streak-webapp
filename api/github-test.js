// GitHub API test endpoint
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    console.log('GitHub test - Authorization header:', authHeader ? 'Present' : 'Missing');
    console.log('GitHub test - Token format:', token ? 'Bearer token' : 'No token');

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Missing token.'
      });
    }

    // Make a simple GitHub API request to test the token
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        status: 'error',
        message: `GitHub API error: ${errorData.message || 'Unknown error'}`,
        githubStatus: response.status,
        githubHeaders: Object.fromEntries(response.headers.entries())
      });
    }

    const data = await response.json();

    // Return a simple response with basic user info
    return res.status(200).json({
      status: 'success',
      message: 'GitHub API test successful',
      user: {
        login: data.login,
        id: data.id,
        name: data.name,
        avatarUrl: data.avatar_url,
        publicRepos: data.public_repos
      }
    });
  } catch (error) {
    console.error('Error in GitHub test endpoint:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while testing GitHub API',
      error: error.message
    });
  }
} 