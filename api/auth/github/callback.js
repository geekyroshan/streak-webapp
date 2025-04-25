// Simple GitHub OAuth callback handler
module.exports = async (req, res) => {
  console.log('GitHub OAuth callback hit:', req.url);
  
  try {
    // For now, just log the authorization code from GitHub
    const code = req.query.code;
    console.log('Received GitHub authorization code:', code);
    
    // In a complete implementation, we would:
    // 1. Exchange this code for an access token
    // 2. Fetch the user's GitHub profile
    // 3. Create/update user in our database
    // 4. Generate a JWT token
    // 5. Set cookies and redirect to frontend
    
    // For this simplified version, just redirect to home with a message
    return res.status(200).json({
      status: 'success',
      message: 'GitHub authentication received. This is a simplified callback for testing.',
      code: code,
      note: 'In a real implementation, this would complete the OAuth flow and redirect to the frontend.'
    });
  } catch (error) {
    console.error('Error in GitHub OAuth callback:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Unknown error occurred'
    });
  }
}; 