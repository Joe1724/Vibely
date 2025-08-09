import User from '../models/User.js';
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
    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-passwordHash');
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
    const me = req.user?._id || req.user?.id;
    const targetId = req.params.id;
    if (me === targetId) return res.status(400).json({ message: 'Cannot follow yourself' });
    const meDoc = await User.findById(me);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (!meDoc.following.includes(target._id)) meDoc.following.push(target._id);
    if (!target.followers.includes(meDoc._id)) target.followers.push(meDoc._id);
    await meDoc.save();
    await target.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const me = req.user?._id || req.user?.id;
    const targetId = req.params.id;
    const meDoc = await User.findById(me);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });
    meDoc.following = meDoc.following.filter((id) => id.toString() !== targetId);
    target.followers = target.followers.filter((id) => id.toString() !== me);
    await meDoc.save();
    await target.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


