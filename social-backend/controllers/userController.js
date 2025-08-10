import User from '../models/User.js';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export const searchUsers = async (req, res) => {
  try {
    const query = (req.query.query || '').trim();
    if (!query) return res.json([]);

    const regex = new RegExp(query, 'i');
    const users = await User.find({
      $or: [{ username: regex }, { email: regex }],
    })
      .select('-passwordHash')
      .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export default { searchUsers };
 
// Profile update (bio and avatar upload)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const avatarFilter = (req, file, cb) => {
  if (file.mimetype?.startsWith('image/')) return cb(null, true);
  cb(Object.assign(new Error('Only image uploads are allowed'), { status: 400 }));
};

export const uploadAvatar = multer({ storage, fileFilter: avatarFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('avatar');
export const uploadCover = multer({ storage, fileFilter: avatarFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('cover');

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    const updates = {};
    if (typeof req.body.bio === 'string') updates.bio = req.body.bio;
    if (typeof req.body.firstName === 'string' && req.body.firstName.trim()) updates.firstName = req.body.firstName.trim();
    if (typeof req.body.middleName === 'string') updates.middleName = req.body.middleName.trim();
    if (typeof req.body.surname === 'string' && req.body.surname.trim()) updates.surname = req.body.surname.trim();

    // Username change with uniqueness check
    if (typeof req.body.username === 'string' && req.body.username.trim()) {
      const newUsername = req.body.username.trim();
      const taken = await User.findOne({ username: newUsername, _id: { $ne: userId } });
      if (taken) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      updates.username = newUsername;
    }

    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCover = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    if (!req.file) return res.status(400).json({ message: 'No cover image' });
    const user = await User.findByIdAndUpdate(
      userId,
      { cover: `/uploads/${req.file.filename}` },
      { new: true }
    ).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Public user profile by id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const followUser = async (req, res) => {
  try {
    const meId = String(req.user?._id || req.user?.id || '');
    const targetId = String(req.params.id || '');
    if (!meId) return res.status(401).json({ message: 'Not authenticated' });
    if (!targetId) return res.status(400).json({ message: 'Invalid target' });
    if (!mongoose.Types.ObjectId.isValid(meId) || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (meId === targetId) return res.status(400).json({ message: 'Cannot follow yourself' });
    const target = await User.findById(targetId).select('_id');
    if (!target) return res.status(404).json({ message: 'User not found' });
    const upd1 = await User.updateOne({ _id: meId }, { $addToSet: { following: target._id } });
    if (upd1.matchedCount === 0) return res.status(401).json({ message: 'Not authenticated' });
    await User.updateOne({ _id: target._id }, { $addToSet: { followers: meId } });
    res.json({ ok: true });
  } catch (err) {
    if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid user id' });
    console.error('followUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const meId = String(req.user?._id || req.user?.id || '');
    const targetId = String(req.params.id || '');
    if (!meId) return res.status(401).json({ message: 'Not authenticated' });
    if (!targetId) return res.status(400).json({ message: 'Invalid target' });
    if (!mongoose.Types.ObjectId.isValid(meId) || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const target = await User.findById(targetId).select('_id');
    if (!target) return res.status(404).json({ message: 'User not found' });
    const upd1 = await User.updateOne({ _id: meId }, { $pull: { following: target._id } });
    if (upd1.matchedCount === 0) return res.status(401).json({ message: 'Not authenticated' });
    await User.updateOne({ _id: target._id }, { $pull: { followers: meId } });
    res.json({ ok: true });
  } catch (err) {
    if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid user id' });
    console.error('unfollowUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


