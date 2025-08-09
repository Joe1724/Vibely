import express from 'express';
import authMiddleware from '../middleware/authmiddleware.js';
import { listConversations, listRequests, startDirect, respondRequest, createGroup, sendMessage, listMessages } from '../controllers/chatController.js';

const router = express.Router();

router.get('/conversations', authMiddleware, listConversations);
router.get('/requests', authMiddleware, listRequests);
router.post('/conversations/direct', authMiddleware, startDirect);
router.post('/conversations/group', authMiddleware, createGroup);
router.put('/conversations/:id/respond', authMiddleware, respondRequest);

router.get('/conversations/:id/messages', authMiddleware, listMessages);
router.post('/conversations/:id/messages', authMiddleware, sendMessage);

export default router;


