// BACKEND/routes/testimonialRoutes.js
const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');

// Create a testimonial
router.post('/', authMiddleware, async (req, res) => {
  try {
    const newTestimonial = new Testimonial({
      user: req.user.id,
      content: req.body.content
    });

    const testimonial = await newTestimonial.save();
    const populatedTestimonial = await Testimonial.findById(testimonial._id).populate('user', 'name username').exec();
    res.json(populatedTestimonial);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 }).populate('user', 'name username');
    res.json(testimonials);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get a single testimonial
router.get('/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id)
      .populate('user', 'name username')
      .populate('comments.user', 'name username')
      .exec();
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }
    res.json(testimonial);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update testimonial
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ msg: 'Invalid testimonial ID' });
    }

    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    // Check if the user is authorized to update the testimonial
    if (testimonial.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Update content and save
    testimonial.content = req.body.content;
    await testimonial.save();

    // Fetch updated testimonial with populated user data
    const updatedTestimonial = await Testimonial.findById(testimonial._id).populate('user', 'name username').exec();
    res.json(updatedTestimonial);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// Delete Testimonial
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    if (testimonial.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await testimonial.deleteOne();
    res.json({ msg: 'Testimonial removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a reaction to a testimonial
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { type, action } = req.body;
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) return res.status(404).json({ msg: 'Testimonial not found' });

    const existingReactionIndex = testimonial.reactions.findIndex(r => r.user.toString() === req.user.id);

    if (existingReactionIndex !== -1) {
      // Update or remove reaction
      if (testimonial.reactions[existingReactionIndex].type === type) {
        testimonial.reactions.splice(existingReactionIndex, 1);
      } else {
        testimonial.reactions[existingReactionIndex].type = type;
      }
    } else {
      // Add new reaction
      testimonial.reactions.push({ user: req.user.id, type });

      // Create notification for testimonial owner if it's a new reaction
      if (action === 'add' && testimonial.user.toString() !== req.user.id) {
        await Notification.create({
          user: testimonial.user,
          type: 'like',
          post: testimonial._id,
          postModel: 'Testimonial',
          creator: req.user.id
        });
      }
    }

    await testimonial.save();
    return res.json({ reactions: testimonial.reactions });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// Add a comment to a testimonial
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) return res.status(404).json({ msg: 'Testimonial not found' });

    // Handle comment logic
    const comment = { user: req.user.id, content };
    testimonial.comments.push(comment);
    await testimonial.save();

    // Create notification for testimonial owner if the comment is not from them
    if (testimonial.user.toString() !== req.user.id) {
      await Notification.create({
        user: testimonial.user,
        type: 'comment',
        post: testimonial._id,
        postModel: 'Testimonial',
        creator: req.user.id
      });
    }

    return res.json(testimonial);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});


module.exports = router;