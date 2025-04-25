// Simple health check endpoint
module.exports = (req, res) => {
  console.log('Health check endpoint hit');
  
  res.status(200).json({
    status: 'ok',
    message: 'API is functioning',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || 'not set',
      hasGithubConfig: !!process.env.GITHUB_CLIENT_ID
    }
  });
}; 