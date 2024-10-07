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
    res.json(testimonial);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 }).populate('user', 'name');
    res.json(testimonials);
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