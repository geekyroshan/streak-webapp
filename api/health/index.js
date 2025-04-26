// Health check endpoint
export default function handler(req, res) {
  try {
    return res.status(200).json({
      status: "ok",
      message: "API is functioning",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error.message
    });
  }
} 