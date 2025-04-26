// Auth API index handler
module.exports = (req, res) => {
  console.log('Auth API index hit:', req.url);
  
  // Return information about available auth endpoints
  return res.status(200).json({
    status: 'success',
    message: 'Auth API is working',
    availableEndpoints: {
      githubAuth: '/api/auth/github',
      githubCallback: '/api/auth/github/callback'
    },
    timestamp: new Date().toISOString()
  });
}; 