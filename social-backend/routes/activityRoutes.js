import express from 'express';
import { getActivities } from '../controllers/activityController.js';
import auth from '../middleware/authmiddleware.js';

const router = express.Router();

// Get all activities for the authenticated user
router.get('/', auth, getActivities);

export default router;