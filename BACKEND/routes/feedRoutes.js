// BACKEND/routes/feedRoutes.js;
const express = require('express');
const router = express.Router();
const Feed = require('../models/Feed');
const Notification = require('../models/Notification');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Create a feed post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const newFeed = new Feed({
      user: req.user.id,
      content,
      attachments
    });
    const feed = await newFeed.save();
    res.json(feed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const posts = await Feed.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name username');
    
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    console.log(err, 'error in feed post fetch');
    res.status(500).send('Server Error');
  }
});

// Get all feed posts
router.get('/', async (req, res) => {
  try {
    const feeds = await Feed.find().sort({ createdAt: -1 }).populate('user', 'name');
    res.json(feeds);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get a single feed post
router.get('/:id', async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id)
      .populate('user', 'name')
      .populate('comments.user', 'name');
    
    if (!feed) {
      return res.status(404).json({ msg: 'Feed post not found' });
    }
    
    res.json(feed);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Feed post not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Update a feed post
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const feed = await Feed.findById(req.params.id);

    if (!feed) {
      return res.status(404).json({ msg: 'Feed post not found' });
    }

    // Check user authorization
    if (feed.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Update the feed post
    feed.content = content;
    feed.attachments = attachments;

    await feed.save();

    res.json(feed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a feed post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) {
      return res.status(404).json({ msg: 'Feed post not found' });
    }
    // Check user authorization
    if (feed.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await feed.deleteOne();
    res.json({ msg: 'Feed post removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// In your reaction handler
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { type } = req.body; // 'like' or emoji
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // Check if the user already reacted
    const existingReactionIndex = post.reactions.findIndex(r => r.user.toString() === req.user.id);
    
    if (existingReactionIndex !== -1) {
      // Remove previous reaction if it's the same type or update it
      if (post.reactions[existingReactionIndex].type === type) {
        post.reactions.splice(existingReactionIndex, 1); // Remove reaction
      } else {
        post.reactions[existingReactionIndex].type = type; // Update to new reaction type
      }
    } else {
      // Add the new reaction
      const reaction = { user: req.user.id, type };
      post.reactions.push(reaction);

      // Create notification for post owner if it's a new reaction
      if (req.body.action === 'add' && post.user.toString() !== req.user.id) {
        await Notification.create({
          user: post.user,
          type: 'like',
          post: post._id,
          creator: req.user.id
        });
      }
    }

    await post.save();
    return res.json({ reactions: post.reactions });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});


// In your comment handler
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // Handle comment logic
    const comment = { user: req.user.id, content };
    post.comments.push(comment);
    await post.save();

    // Create notification for post owner if the comment is not from them
    if (post.user.toString() !== req.user.id) {
      await Notification.create({
        user: post.user,
        type: 'comment',
        post: post._id,
        creator: req.user.id
      });
    }

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


module.exports = router;