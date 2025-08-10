import express from 'express';
import authMiddleware from '../middleware/authmiddleware.js';
import { listConversations, listRequests, startDirect, respondRequest, createGroup, sendMessage, listMessages, renameConversation, setAdmin, setNickname, resetInvite, joinByInvite, leaveConversation, transferOwnership, pinMessage, reactMessage, editMessage, deleteMessage, replyMessage, muteConversation, setTyping, markSeen } from '../controllers/chatController.js';

const router = express.Router();

router.get('/conversations', authMiddleware, listConversations);
router.get('/requests', authMiddleware, listRequests);
router.post('/conversations/direct', authMiddleware, startDirect);
router.post('/conversations/group', authMiddleware, createGroup);
router.put('/conversations/:id/respond', authMiddleware, respondRequest);

router.get('/conversations/:id/messages', authMiddleware, listMessages);
router.post('/conversations/:id/messages', authMiddleware, sendMessage);
router.post('/conversations/:id/messages/reply', authMiddleware, replyMessage);
router.put('/messages/:id/react', authMiddleware, reactMessage);
router.put('/messages/:id/edit', authMiddleware, editMessage);
router.delete('/messages/:id', authMiddleware, deleteMessage);
router.put('/conversations/:id/rename', authMiddleware, renameConversation);
router.put('/conversations/:id/role', authMiddleware, setAdmin);
router.put('/conversations/:id/nickname', authMiddleware, setNickname);
router.put('/conversations/:id/invite/reset', authMiddleware, resetInvite);
router.post('/conversations/join', authMiddleware, joinByInvite);
router.post('/conversations/:id/leave', authMiddleware, leaveConversation);
router.put('/conversations/:id/transfer', authMiddleware, transferOwnership);
router.put('/conversations/:id/pin', authMiddleware, pinMessage);
router.put('/conversations/:id/mute', authMiddleware, muteConversation);
router.put('/conversations/:id/typing', authMiddleware, setTyping);
router.put('/conversations/:id/seen', authMiddleware, markSeen);

export default router;


