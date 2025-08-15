import Activity from '../models/Activity.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';

export const getActivities = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        const activities = await Activity.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('user', 'username avatar')
            .populate({
                path: 'refId',
                // Conditional population based on 'type' is complex in Mongoose.
                // For simplicity, we'll populate common fields and let frontend handle specific data.
                // Alternatively, you could use a switch statement here to populate different models.
                // Example:
                // populate: [
                //     { path: 'refId', model: 'Post', select: 'text image video' },
                //     { path: 'refId', model: 'User', select: 'username avatar' },
                //     { path: 'refId', model: 'Message', select: 'text' }
                // ]
            });
        res.json(activities);
    } catch (err) {
        console.error('Error fetching activities:', err.message);
        res.status(500).send('Server Error');
    }
};