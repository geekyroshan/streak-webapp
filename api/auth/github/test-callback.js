// Simple test callback handler
export default function handler(req, res) {
  try {
    const code = req.query.code;
    
    return res.status(200).json({
      status: "success",
      message: "Callback received",
      code: code || "No code provided",
      query: req.query || {}
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server Error",
      message: error.message
    });
  }
} 