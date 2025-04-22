import express from 'express';
import { 
  getUserRepositories,
  getRepository
} from '../controllers/repository.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes
router.get('/', getUserRepositories);
router.get('/:owner/:repo', getRepository);

export default router; 