import express from 'express';
import authMiddleware from '../middleware/authmiddleware.js';
import { searchUsers, updateProfile, uploadAvatar, uploadCover, updateCover, getUserById, followUser, unfollowUser, toggleBookmark, getBookmarks, heartbeat, updateNotificationSettings, getUserSuggestions } from '../controllers/userController.js';

const router = express.Router();

router.get('/search', authMiddleware, searchUsers);
router.get('/suggestions', authMiddleware, getUserSuggestions);
router.put('/me', authMiddleware, uploadAvatar, updateProfile);
router.put('/me/cover', authMiddleware, uploadCover, updateCover);
router.get('/:id', authMiddleware, getUserById);
router.put('/:id/follow', authMiddleware, followUser);
router.put('/:id/unfollow', authMiddleware, unfollowUser);
router.put('/me/bookmarks/:postId', authMiddleware, toggleBookmark);
router.get('/me/bookmarks', authMiddleware, getBookmarks);
router.put('/me/heartbeat', authMiddleware, heartbeat);
router.put('/me/settings/notifications', authMiddleware, updateNotificationSettings);

export default router;


