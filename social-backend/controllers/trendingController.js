import Post from '../models/Post.js';

export const getTrendingTopics = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trends = await Post.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, hashtags: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, hashtag: '$_id', count: 1 } }
    ]);

    res.json(trends);
  } catch (err) {
    console.error('getTrendingTopics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};