import express from 'express';
import { getTrendingTopics } from '../controllers/trendingController.js';

const router = express.Router();

router.get('/', getTrendingTopics);

export default router;