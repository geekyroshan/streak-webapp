// Health check endpoint for Vercel
export default function handler(req, res) {
  console.log('[Health Check] Request received');
  
  return res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
} 