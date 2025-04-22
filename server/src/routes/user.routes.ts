import express from 'express';
import { 
  getUserSettings,
  updateUserSettings,
  addCommitTemplate,
  removeCommitTemplate
} from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes
router.get('/settings', getUserSettings);
router.patch('/settings', updateUserSettings);
router.post('/settings/templates', addCommitTemplate);
router.delete('/settings/templates', removeCommitTemplate);

export default router; 