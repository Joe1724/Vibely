import User from '../models/User.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import Activity from '../models/Activity.js';
import Announcement from '../models/Announcement.js';
import Ad from '../models/Ad.js';
import Setting from '../models/Setting.js';

// Dashboard Overview
export const getDashboardOverview = async (req, res) => {
  try {
    // User counts
    const totalUsers = await User.countDocuments();
    const newSignUpsToday = await User.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
    });
    // Active users today (example: users who logged in or posted today)
    const activeUsersToday = await User.countDocuments({
      lastActiveAt: { $gte: new Date().setHours(0, 0, 0, 0) },
    });

    // Post counts
    const totalPosts = await Post.countDocuments();
    const flaggedPosts = await Post.countDocuments({ 'reports.0': { '$exists': true } }); // Posts with at least one report

    // Active reports (example: notifications related to reports that are still 'pending')
    // This assumes a 'status' field on reports or notifications related to reports
    const activeReports = await Notification.countDocuments({
      type: 'report', // Assuming 'report' type for notifications
      isRead: false, // Assuming unread reports are active
    });

    // Real-time activity feed (fetch recent activities)
    const recentActivities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'username avatar')
      .populate('postId', 'content')
      .populate('commentId', 'content');

    res.status(200).json({
      userStats: {
        totalUsers,
        activeUsersToday,
        newSignUpsToday,
      },
      postStats: {
        totalPosts,
        flaggedPosts,
      },
      reportStats: {
        activeReports,
      },
      recentActivities,
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User Management
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash'); // Exclude password hash
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, bio, role, isVerified } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.role = role || user.role;
    user.isVerified = isVerified !== undefined ? isVerified : user.isVerified;

    await user.save();
    res.status(200).json({ message: 'User profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isVerified: false }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User suspended successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isVerified: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User activated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Content Moderation
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getReportedPosts = async (req, res) => {
  try {
    const reportedPosts = await Post.find({ 'reports.0': { '$exists': true } })
      .populate('userId', 'username avatar')
      .populate('reports.reportedBy', 'username')
      .sort({ 'reports.createdAt': -1 });
    res.status(200).json(reportedPosts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const approvePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(id, { reports: [] }, { new: true }); // Clear reports
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json({ message: 'Post approved successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Ads & Announcements
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { content } = req.body;
    const newAnnouncement = new Announcement({ content, createdBy: req.user.id });
    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAds = async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createAd = async (req, res) => {
  try {
    const { title, content, link } = req.body;
    const newAd = new Ad({ title, content, link, createdBy: req.user.id });
    await newAd.save();
    res.status(201).json(newAd);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    await Ad.findByIdAndDelete(id);
    res.status(200).json({ message: 'Ad deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Placeholder for other admin functionalities
export const getAnalytics = async (req, res) => {
  try {
    // User Engagement
    const dailyLogins = await Activity.countDocuments({
      type: 'login',
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
    });

    // Growth Stats
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
    });
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: startOfWeek },
    });
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Top Content
    const topContent = await Post.find()
      .sort({ 'likes.length': -1 })
      .limit(5)
      .select('content likes');

    res.status(200).json({
      userEngagement: {
        avgTimeSpent: 'N/A', // This would require more complex tracking
        dailyLogins,
      },
      growthStats: {
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      },
      topContent,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    res.status(200).json(settingsMap);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    for (const key in settings) {
      await Setting.findOneAndUpdate({ key }, { value: settings[key] }, { upsert: true });
    }
    res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Messaging Control
export const getFlaggedConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ isFlagged: true })
      .populate('members', 'username avatar')
      .populate('lastMessage');
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};