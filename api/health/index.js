// Simple health check endpoint
module.exports = (req, res) => {
  try {
    res.status(200).json({
      status: "ok",
      message: "API is functioning",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error.message
    });
  }
}; 