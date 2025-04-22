import express from 'express';
import { 
  getUserContributions,
  getStreakStats
} from '../controllers/contribution.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes
router.get('/', getUserContributions);
router.get('/stats', getStreakStats);

export default router; 