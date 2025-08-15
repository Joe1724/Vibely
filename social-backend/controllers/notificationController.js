import Notification from '../models/Notification.js';
import User from '../models/User.js'; // Import User model
import { sendMail } from '../utils/mailer.js'; // Import mailer utility

// Get notifications for the authenticated user
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .populate('sender', 'username profilePicture')
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Mark a notification as read
export const markAsRead = async (req, res) => {
    try {
        let notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        // Ensure user owns the notification
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        notification.read = true;
        await notification.save();

        res.json({ msg: 'Notification marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Mark all notifications as read for the authenticated user
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, read: false },
            { $set: { read: true } }
        );
        res.json({ msg: 'All notifications marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Placeholder for sending push notifications
const sendPushNotification = async (recipientId, title, body, data) => {
    try {
        // In a real application, this would integrate with a push notification service
        // (e.g., Firebase Cloud Messaging, OneSignal, etc.)
        console.log(`Sending push notification to user ${recipientId}: ${title} - ${body}`);
        console.log('Notification data:', data);
        // Example:
        // const user = await User.findById(recipientId);
        // if (user && user.fcmToken) {
        //   // Use a push notification library to send to user.fcmToken
        //   // admin.messaging().sendToDevice(user.fcmToken, { notification: { title, body }, data });
        // }
    } catch (err) {
        console.error('Error sending push notification:', err.message);
    }
};

// Function for sending email notifications
const sendEmailNotification = async (recipientId, subject, htmlContent) => {
    try {
        const recipientUser = await User.findById(recipientId).select('email');
        if (recipientUser && recipientUser.email) {
            await sendMail({
                to: recipientUser.email,
                subject: subject,
                html: htmlContent
            });
            console.log(`Email notification sent to ${recipientUser.email}`);
        }
    } catch (err) {
        console.error('Error sending email notification:', err.message);
    }
};

// Helper function to create a new notification (can be called by other controllers)
export const createNotification = async ({ recipient, sender, type, refId }) => {
    try {
        const newNotification = new Notification({
            recipient,
            sender,
            type,
            refId
        });
        await newNotification.save();

        // Fetch recipient's notification settings and sender's username
        const recipientUser = await User.findById(recipient).select('notificationSettings email');
        const senderUser = sender ? await User.findById(sender).select('username') : null;
        const senderUsername = senderUser ? senderUser.username : 'Someone';

        let pushTitle = '';
        let pushBody = '';
        let emailSubject = '';
        let emailHtml = '';

        switch (type) {
            case 'like':
                pushTitle = 'New Like!';
                pushBody = `${senderUsername} liked your post.`;
                break;
            case 'comment':
                pushTitle = 'New Comment!';
                pushBody = `${senderUsername} commented on your post.`;
                break;
            case 'follow':
                pushTitle = 'New Follower!';
                pushBody = `${senderUsername} started following you.`;
                emailSubject = 'New Follower on SocialApp!';
                emailHtml = `<p>Hey there!</p><p>${senderUsername} just started following you on SocialApp.</p><p>Check out their profile: <a href="${process.env.FRONTEND_URL}/profile/${sender}">@${senderUsername}</a></p>`;
                break;
            case 'message':
                pushTitle = 'New Message!';
                pushBody = `${senderUsername} sent you a message.`;
                emailSubject = 'New Message on SocialApp!';
                emailHtml = `<p>Hey there!</p><p>${senderUsername} sent you a new message on SocialApp.</p><p>Log in to reply!</p>`;
                break;
            default:
                pushTitle = 'New Notification';
                pushBody = 'You have a new notification.';
        }

        // Send push notification if enabled
        if (recipientUser?.notificationSettings?.push?.[type]) {
            sendPushNotification(recipient, pushTitle, pushBody, { type, refId: refId.toString() });
        }

        // Send email notification if enabled for specific types
        if (recipientUser?.notificationSettings?.email?.[type]) {
            sendEmailNotification(recipient, emailSubject, emailHtml);
        }

        return newNotification;
    } catch (err) {
        console.error(err.message);
        // In a real application, you might want to log this error more robustly
    }
};