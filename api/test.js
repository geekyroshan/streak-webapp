// ES Modules format
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
    // Check authentication
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);

    // Return basic information about the request
    return res.status(200).json({
      status: 'success',
      message: 'API test endpoint is working',
      headers: {
        authorization: authHeader ? 'Present' : 'Missing',
        authType: authHeader ? authHeader.split(' ')[0] : 'None',
        cookie: req.headers.cookie ? 'Present' : 'Missing'
      },
      serverTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred in the test endpoint',
      error: error.message
    });
  }
} 