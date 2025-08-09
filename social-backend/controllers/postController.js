import Post from "../models/Post.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
  const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (file.mimetype?.startsWith('image/') || allowed.includes(ext)) {
    return cb(null, true);
  }
  cb(Object.assign(new Error('Only image uploads are allowed'), { status: 400 }));
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

// Create post
export const createPost = async (req, res) => {
  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.image || "";
    const authenticatedUserId = req.user?._id || req.user?.id;
    if (!authenticatedUserId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const newPost = new Post({
      user: authenticatedUserId,
      text: req.body.text,
      image: imageUrl,
    });
    const savedPost = await newPost.save();
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
      filter.user = req.query.user;
    }

    if (!usePagination) {
      const posts = await Post.find(filter)
        .populate("user", "username email")
        .sort({ createdAt: -1 });
      return res.json(posts);
    }

    const posts = await Post.find(filter)
      .populate("user", "username email")
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

    post.text = req.body.text || post.text;
    post.image = req.body.image || post.image;

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

// Like post
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

    const comment = {
      user: req.user.id,
      text: req.body.text,
    };

    post.comments.unshift(comment);
    await post.save();
    res.json(post.comments);
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
    res.json(post.comments);
  } catch (error) {
    console.error('deleteComment error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Search posts by text
export const searchPosts = async (req, res) => {
  try {
    const query = (req.query.query || '').trim();
    if (!query) return res.json([]);
    const regex = new RegExp(query, 'i');
    const posts = await Post.find({ text: regex })
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch (error) {
    console.error('searchPosts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
