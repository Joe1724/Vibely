import express from 'express';
import {
  getDashboardOverview,
  getAllUsers,
  updateUserProfile,
  suspendUser,
  activateUser,
  deleteUser,
  getAllPosts,
  getReportedPosts,
  approvePost,
  deletePost,
  getAnalytics,
  getSettings,
  getFlaggedConversations,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getAds,
  createAd,
  deleteAd,
  updateSettings,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authmiddleware.js';

const router = express.Router();

// All admin routes will be protected and only accessible by 'admin' role
router.use(protect);
router.use(authorize('admin'));

// Dashboard Overview
router.get('/dashboard', getDashboardOverview);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserProfile);
router.put('/users/suspend/:id', suspendUser);
router.put('/users/activate/:id', activateUser);
router.delete('/users/:id', deleteUser);

// Content Moderation
router.get('/posts', getAllPosts);
router.get('/posts/reported', getReportedPosts);
router.put('/posts/approve/:id', approvePost);
router.delete('/posts/:id', deletePost);

// Analytics (Placeholder)
router.get('/analytics', getAnalytics);

// Settings (Placeholder)
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Messaging Control
router.get('/conversations/flagged', getFlaggedConversations);

// Ads & Announcements
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);
router.get('/ads', getAds);
router.post('/ads', createAd);
router.delete('/ads/:id', deleteAd);

export default router;