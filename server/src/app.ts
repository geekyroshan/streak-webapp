import express from 'express';
import cors from 'cors';

const app = express();

// Place CORS middleware BEFORE any other middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'https://github-streak-manager.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Then add other middleware
app.use(express.json());
// ...other middleware 

// Global error handler (should be last middleware)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}); 