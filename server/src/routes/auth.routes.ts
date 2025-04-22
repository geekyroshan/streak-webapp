import express from 'express';
import { 
  githubAuth, 
  githubCallback, 
  logout, 
  getCurrentUser 
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Test endpoint - no auth required
router.get('/test', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'API is working!',
    timestamp: new Date().toISOString() 
  });
});

// GitHub OAuth routes
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);

// User auth routes
router.get('/logout', logout);
router.get('/me', protect, getCurrentUser);

export default router; 