// GitHub auth endpoint 
export default function handler(req, res) {
  try {
    // Hardcoded GitHub Client ID
    const githubClientId = "Ov23liZPhqlr3PBuhGK8";
    
    // Construct GitHub OAuth URL
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=user,repo`;
    
    // Send redirect response
    res.writeHead(302, { "Location": githubAuthUrl });
    return res.end();
  } catch (error) {
    return res.status(500).json({
      status: "error", 
      message: "GitHub authentication failed",
      error: error.message
    });
  }
} 