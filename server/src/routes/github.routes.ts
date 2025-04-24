import express from 'express';
import { 
  getGithubActivities,
  getGithubProfile, 
  getContributionStats,
  getRepositories,
  exportActivityData
} from '../controllers/github.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes
router.use(protect);

// GitHub activity routes
router.get('/activities', getGithubActivities);
router.get('/profile', getGithubProfile);
router.get('/stats', getContributionStats);
router.get('/repositories', getRepositories);
router.get('/export', exportActivityData);

export default router; 