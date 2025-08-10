import express from 'express';
import authMiddleware from '../middleware/authmiddleware.js';
import {
  createPost,
  getPosts,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  deleteComment,
  uploadMiddleware,
  searchPosts,
  addReply,
  deleteReply,
  setReaction,
  clearReaction,
  addView,
} from '../controllers/postController.js';

const router = express.Router();

// CRUD
router.post('/', authMiddleware, uploadMiddleware, createPost);
router.get('/', authMiddleware, getPosts);
router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);

// Reactions & comments
router.put('/like/:id', authMiddleware, likePost);
router.put('/unlike/:id', authMiddleware, unlikePost);
router.post('/comment/:id', authMiddleware, addComment);
router.delete('/comment/:id/:commentId', authMiddleware, deleteComment);
router.post('/reply/:id/:commentId', authMiddleware, addReply);
router.delete('/reply/:id/:commentId/:replyId', authMiddleware, deleteReply);
router.put('/reaction/:id', authMiddleware, setReaction);
router.delete('/reaction/:id', authMiddleware, clearReaction);
router.post('/view/:id', authMiddleware, addView);

// Search
router.get('/search', authMiddleware, searchPosts);

export default router;
