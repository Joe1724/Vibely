import Post from "../models/Post.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';
import { createActivity } from '../utils/activityLogger.js';

// Ensure uploads dir exists (cross-platform)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const imageExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const videoExt = ['.mp4', '.webm', '.ogg', '.mov'];
  const ext = (path.extname(file.originalname || '').toLowerCase()) || '';
  const isImage = file.mimetype?.startsWith('image/') || imageExt.includes(ext);
  const isVideo = file.mimetype?.startsWith('video/') || videoExt.includes(ext);
  if (isImage || isVideo) return cb(null, true);
  cb(Object.assign(new Error('Only image/video uploads are allowed'), { status: 400 }));
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
}).single('media');

// Create post
export const createPost = async (req, res) => {
  try {
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.media || req.body.image || "");
    const authenticatedUserId = req.user?._id || req.user?.id;
    if (!authenticatedUserId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Extract hashtags and mentions
    const text = String(req.body.text || '').trim();
    const hashtags = Array.from(new Set((text.match(/#([\w-]{1,50})/g) || []).map((t) => t.slice(1).toLowerCase())));
    const usernames = Array.from(new Set((text.match(/@([a-zA-Z0-9_\.\-]{2,30})/g) || []).map((t) => t.slice(1))));
    const mentionedUsers = usernames.length > 0 ? await User.find({ username: { $in: usernames } }).select('_id') : [];

    const newPost = new Post({
      user: authenticatedUserId,
      text,
      image: req.file && req.file.mimetype?.startsWith('image/') ? mediaUrl : undefined,
      video: req.file && req.file.mimetype?.startsWith('video/') ? mediaUrl : undefined,
      hashtags,
      mentions: mentionedUsers.map((u) => u._id),
    });
    const savedPost = await newPost.save();
    // Log activity for post creation
    await createActivity({
      user: authenticatedUserId,
      type: 'post',
      refId: savedPost._id
    });
    res.status(201).json(savedPost);
  } catch (error) {
    console.error('createPost error:', error);
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

// Get all posts
export const getPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const usePagination = !!req.query.page || !!req.query.limit;
    const filter = {};
    if (req.query.user) {
      const targetUser = await User.findById(req.query.user).select('isPrivate followers');
      if (targetUser?.isPrivate) {
        const meId = String(req.user?._id || req.user?.id || '');
        if (String(targetUser._id) !== meId && !targetUser.followers.some(f => String(f) === meId)) {
          return res.json(usePagination ? { posts: [], hasMore: false, nextPage: null } : []);
        }
      }
      filter.user = req.query.user;
    }

    if (!usePagination) {
      const posts = await Post.find(filter)
        .populate("user", "username email avatar")
        .populate("comments.user", "username avatar")
        .populate("comments.replies.user", "username avatar")
        .sort({ createdAt: -1 });
      return res.json(posts);
    }

    const posts = await Post.find(filter)
      .populate("user", "username email avatar")
      .populate("comments.user", "username avatar")
      .populate("comments.replies.user", "username avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const pagePosts = hasMore ? posts.slice(0, limit) : posts;
    res.json({ posts: pagePosts, hasMore, nextPage: hasMore ? page + 1 : null });
  } catch (error) {
    console.error('getPosts error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update post
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const text = typeof req.body.text === 'string' ? req.body.text : post.text;
    post.text = text;
    if (typeof req.body.image === 'string') post.image = req.body.image;
    if (typeof req.body.video === 'string') post.video = req.body.video;
    post.editedAt = new Date();
    // Recompute hashtags and mentions
    const hashtags = Array.from(new Set((text.match(/#([\w-]{1,50})/g) || []).map((t) => t.slice(1).toLowerCase())));
    const usernames = Array.from(new Set((text.match(/@([a-zA-Z0-9_\.\-]{2,30})/g) || []).map((t) => t.slice(1))));
    const mentionedUsers = usernames.length > 0 ? await User.find({ username: { $in: usernames } }).select('_id') : [];
    post.hashtags = hashtags;
    post.mentions = mentionedUsers.map((u) => u._id);

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (error) {
    console.error('updatePost error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (error) {
    console.error('deletePost error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Like post (legacy)
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({ message: "Post already liked" });
    }

    post.likes.push(req.user.id);
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error('likePost error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Unlike post
export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.likes = post.likes.filter(
      (like) => like.toString() !== req.user.id
    );

    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error('unlikePost error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add comment
export const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Text is required' });
    const usernames = Array.from(new Set((text.match(/@([a-zA-Z0-9_\.\-]{2,30})/g) || []).map((t) => t.slice(1))));
    const mentionedUsers = usernames.length > 0 ? await User.find({ username: { $in: usernames } }).select('_id') : [];
    const comment = {
      user: req.user.id,
      text,
      mentions: mentionedUsers.map((u) => u._id),
      createdAt: new Date(),
    };

    post.comments.unshift(comment);
    await post.save();

    // Log activity for adding a comment
    await createActivity({
      user: req.user.id,
      type: 'comment',
      refId: post._id
    });

    // Create notification for post owner if not self-commenting
    if (String(post.user) !== String(req.user.id)) {
      await createNotification({
        recipient: post.user,
        sender: req.user.id,
        type: 'comment',
        refId: post._id
      });
    }

    // Create notifications for mentioned users
    for (const mentionedUser of mentionedUsers) {
      if (String(mentionedUser._id) !== String(req.user.id)) { // Avoid notifying self
        await createNotification({
          recipient: mentionedUser._id,
          sender: req.user.id,
          type: 'comment', // Or 'mention' if a separate type is desired
          refId: post._id
        });
      }
    }
    const populated = await Post.findById(req.params.id)
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar')
      .select('comments');
    res.json(populated.comments);
  } catch (error) {
    console.error('addComment error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.find(
      (c) => c.id === req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    post.comments = post.comments.filter(
      (c) => c.id !== req.params.commentId
    );

    await post.save();
    const populated = await Post.findById(req.params.id)
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar')
      .select('comments');
    res.json(populated.comments);
  } catch (error) {
    console.error('deleteComment error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add reply
export const addReply = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Text is required' });
    const usernames = Array.from(new Set((text.match(/@([a-zA-Z0-9_\.\-]{2,30})/g) || []).map((t) => t.slice(1))));
    const mentionedUsers = usernames.length > 0 ? await User.find({ username: { $in: usernames } }).select('_id') : [];
    comment.replies.push({ user: req.user.id, text, mentions: mentionedUsers.map((u) => u._id), createdAt: new Date() });
    await post.save();
    const populated = await Post.findById(postId)
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar')
      .select('comments');
    res.json(populated.comments);
  } catch (error) {
    console.error('addReply error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove reply
export const deleteReply = async (req, res) => {
  try {
    const { id: postId, commentId, replyId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    if (String(reply.user) !== String(req.user.id)) return res.status(401).json({ message: 'Not authorized' });
    reply.deleteOne();
    await post.save();
    const populated = await Post.findById(postId)
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar')
      .select('comments');
    res.json(populated.comments);
  } catch (error) {
    console.error('deleteReply error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set or change reaction
export const setReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const allowed = ['love', 'haha', 'wow'];
    if (!allowed.includes(type)) return res.status(400).json({ message: 'Invalid reaction' });
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    // remove any existing reaction by this user
    post.reactions = post.reactions.filter((r) => String(r.user) !== String(req.user.id));
    post.reactions.push({ user: req.user.id, type });
    // keep legacy likes in sync only for love
    post.likes = post.likes.filter((u) => String(u) !== String(req.user.id));
    if (type === 'love') {
      post.likes.push(req.user.id);
      // Create notification for post owner if not self-liking
      if (String(post.user) !== String(req.user.id)) {
        await createNotification({
          recipient: post.user,
          sender: req.user.id,
          type: 'like',
          refId: post._id
        });
      }
    }
    await post.save();
    // Log activity for liking a post
    if (type === 'love') {
      await createActivity({
        user: req.user.id,
        type: 'like',
        refId: post._id
      });
    }
    res.json(post.reactions);
  } catch (error) {
    console.error('setReaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear reaction
export const clearReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.reactions = post.reactions.filter((r) => String(r.user) !== String(req.user.id));
    post.likes = post.likes.filter((u) => String(u) !== String(req.user.id));
    await post.save();
    res.json(post.reactions);
  } catch (error) {
    console.error('clearReaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Increment views
export const addView = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user?._id || req.user?.id || '');
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const already = post.viewedBy.some((v) => String(v) === userId);
    if (!already) {
      post.views = (post.views || 0) + 1;
      post.viewedBy.push(userId);
      await post.save();
    }
    res.json({ views: post.views });
  } catch (error) {
    console.error('addView error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search posts by text
export const searchPosts = async (req, res) => {
  try {
    const query = (req.query.query || '').trim();
    if (!query) return res.json([]);
    const hashtagMatch = query.startsWith('#') ? query.slice(1).toLowerCase() : null;
    const criteria = hashtagMatch
      ? { hashtags: hashtagMatch }
      : { text: new RegExp(query, 'i') };
    const posts = await Post.find(criteria)
      .populate('user', 'username email avatar')
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    const postUserIds = posts.map(p => p.user._id);
    const postUsers = await User.find({_id: {$in: postUserIds}}).select('isPrivate followers');
    const meId = String(req.user?._id || req.user?.id || '');

    const filteredPosts = posts.filter(p => {
      const author = postUsers.find(u => String(u._id) === String(p.user._id));
      if (!author || author.isPrivate === false) return true;
      if (String(author._id) === meId) return true;
      if (author.followers.some(fId => String(fId) === meId)) return true;
      return false;
    });

    res.json(filteredPosts);
    res.json(posts);
  } catch (error) {
    console.error('searchPosts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
