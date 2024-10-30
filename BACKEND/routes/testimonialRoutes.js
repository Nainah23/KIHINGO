// BACKEND/routes/testimonialRoutes.js
const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
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
    const testimonial = await Testimonial.findById(req.params.id).populate('user', 'name username').populate('comments.user', 'name username').exec();
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }
    res.json(testimonial);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a reaction to a testimonial
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    const newReaction = {
      user: req.user.id,
      type: req.body.type
    };

    testimonial.reactions.push(newReaction);
    await testimonial.save();

    res.json(testimonial.reactions);
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

// Add a comment to a testimonial
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    const newComment = {
      user: req.user.id,
      content: req.body.content
    };

    testimonial.comments.push(newComment);
    await testimonial.save();

    res.json(testimonial.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;