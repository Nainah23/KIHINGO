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
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    
    if (req.user.role === 'member') {
      return res.status(403).json({ message: 'Unauthorized: Members are not allowed to create events' });
    }
    
    if (!title || !description || !date || !location) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    let imageUrl = '';
    
    if (req.file) {
      try {
        console.log('File details:', {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          bufferLength: req.file.buffer.length
        });
        
        imageUrl = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'event-images',
              resource_type: 'auto',
              allowed_formats: ['jpg', 'png', 'jpeg'],
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
              } else {
                console.log('Cloudinary upload success:', result);
                resolve(result.secure_url);
              }
            }
          );
          
          uploadStream.on('error', (error) => {
            console.error('Upload stream error:', error);
            reject(error);
          });
          
          uploadStream.end(req.file.buffer);
        });
      } catch (uploadError) {
        console.error('Detailed upload error:', uploadError);
        return res.status(400).json({
          message: 'Image upload failed',
          error: uploadError.message
        });
      }
    }

    const newEvent = new Event({
      title,
      description,
      date, // Store date as string in YYYY-MM-DD format
      location,
      imageUrl,
      createdBy: req.user.id
    });

    const event = await newEvent.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('Event creation error:', err);
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
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

    await event.deleteOne();

    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
