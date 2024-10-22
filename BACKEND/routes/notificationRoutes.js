// BACKEND/routes/notificationRoutes.js;
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Feed = require('../models/Feed'); // Add this
const User = require('../models/User'); // Add this
const authMiddleware = require('../middleware/authMiddleware');

// Get all notifications for a user with population
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('creator', 'name username profileImage')
      .populate('post', 'content')
      .sort({ createdAt: -1 });

    const formattedNotifications = notifications.map(notification => {
      let content = '';
      if (notification.type === 'like') {
        content = `${notification.creator.name} liked your post: "${notification.post.content.substring(0, 50)}${notification.post.content.length > 50 ? '...' : ''}"`;
      } else if (notification.type === 'comment') {
        content = `${notification.creator.name} commented on your post: "${notification.post.content.substring(0, 50)}${notification.post.content.length > 50 ? '...' : ''}"`;
      }

      return {
        _id: notification._id,
        content,
        creator: notification.creator,
        type: notification.type,
        post: notification.post._id,
        read: notification.read,
        createdAt: notification.createdAt
      };
    });

    res.json(formattedNotifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a notification
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { userId, type, postId } = req.body;

    // Verify post exists
    const post = await Feed.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Don't create notification if user is acting on their own post
    if (post.user.toString() === req.user.id) {
      return res.status(200).json({ msg: 'No notification needed for own post' });
    }

    // Create notification
    const notification = new Notification({
      user: userId,
      type,
      post: postId,
      creator: req.user.id
    });

    await notification.save();

    // Populate the notification with user and post details
    const populatedNotification = await Notification.findById(notification._id)
      .populate('creator', 'name username profileImage')
      .populate('post', 'content');

    // Format the notification content
    let content = '';
    if (type === 'like') {
      content = `${populatedNotification.creator.name} liked your post: "${populatedNotification.post.content.substring(0, 50)}${populatedNotification.post.content.length > 50 ? '...' : ''}"`;
    } else if (type === 'comment') {
      content = `${populatedNotification.creator.name} commented on your post: "${populatedNotification.post.content.substring(0, 50)}${populatedNotification.post.content.length > 50 ? '...' : ''}"`;
    }

    const formattedNotification = {
      _id: notification._id,
      content,
      creator: populatedNotification.creator,
      type: notification.type,
      post: notification.post,
      read: notification.read,
      createdAt: notification.createdAt
    };

    res.json(formattedNotification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Mark a notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('creator', 'name username profileImage')
      .populate('post', 'content');

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Check if the notification belongs to the user
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    notification.read = true;
    await notification.save();

    // Format the notification content
    let content = '';
    if (notification.type === 'like') {
      content = `${notification.creator.name} liked your post: "${notification.post.content.substring(0, 50)}${notification.post.content.length > 50 ? '...' : ''}"`;
    } else if (notification.type === 'comment') {
      content = `${notification.creator.name} commented on your post: "${notification.post.content.substring(0, 50)}${notification.post.content.length > 50 ? '...' : ''}"`;
    }

    const formattedNotification = {
      _id: notification._id,
      content,
      creator: notification.creator,
      type: notification.type,
      post: notification.post._id,
      read: notification.read,
      createdAt: notification.createdAt
    };

    res.json(formattedNotification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Check if the notification belongs to the user
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await notification.deleteOne(); // Updated from remove() to deleteOne()

    res.json({ msg: 'Notification removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get unread notification count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;