// BACKEND/routes/feedRoutes.js;
const express = require('express');
const router = express.Router();
const Feed = require('../models/Feed');
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

// Add reaction to a post
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { type } = req.body; // 'like' or emoji
    const feed = await Feed.findById(req.params.id);

    if (!feed) return res.status(404).json({ msg: 'Feed post not found' });

    // Check if the user already reacted
    const existingReactionIndex = feed.reactions.findIndex(r => r.user.toString() === req.user.id);
    if (existingReactionIndex !== -1) {
      // Remove previous reaction
      feed.reactions.splice(existingReactionIndex, 1);
    }
    
    // Add the new reaction
    const reaction = { user: req.user.id, type };
    feed.reactions.push(reaction);

    await feed.save();
    return res.status(200).json(feed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// Add comment to a post
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const feed = await Feed.findById(req.params.id);

    if (!feed) return res.status(404).json({ msg: 'Feed post not found' });

    const comment = { user: req.user.id, content };
    feed.comments.push(comment);
    await feed.save();

    res.json(feed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



module.exports = router;