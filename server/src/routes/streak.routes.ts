import express from 'express';
import { 
  createBackdatedCommit,
  getCommitHistory,
  scheduleBulkCommits
} from '../controllers/streak.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes
router.post('/backdated-commit', createBackdatedCommit);
router.get('/history', getCommitHistory);
router.post('/bulk', scheduleBulkCommits);

export default router; 