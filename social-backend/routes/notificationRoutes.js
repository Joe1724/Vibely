import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import auth from '../middleware/authmiddleware.js';

const router = express.Router();

// Get all notifications for the authenticated user
router.get('/', auth, notificationController.getNotifications);

// Mark a specific notification as read
router.put('/:id/read', auth, notificationController.markAsRead);

// Mark all notifications as read for the authenticated user
router.put('/read-all', auth, notificationController.markAllAsRead);

export default router;