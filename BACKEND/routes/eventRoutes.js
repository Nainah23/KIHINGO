// BACKEND/routes/eventRoutes.js;
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;  // Cloudinary SDK
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const config = require('../config/config');

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET
});

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // limit file size to 5MB
  }
});

// Create an event
// Create an event
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    
    let imageUrl = '';

    // Only upload the image if it exists
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'event-images' },
          (error, result) => {
            if (error) {
              reject(new Error('Image upload failed'));
            } else {
              resolve(result.secure_url);
            }
          }
        ).end(req.file.buffer);
      });
      imageUrl = uploadResult;
    }

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      imageUrl,
      createdBy: req.user.id
    });

    const event = await newEvent.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }).populate('createdBy', 'name');
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get a single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name');
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update an event
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check user authorization
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    let imageUrl = event.imageUrl;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload_stream(
        { folder: 'event-images' },
        (error, result) => {
          if (error) throw new Error('Image upload failed');
          imageUrl = result.secure_url;
        }
      ).end(req.file.buffer);
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date, location, imageUrl },
      { new: true }
    );

    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete an event
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check user authorization
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await event.remove();

    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
