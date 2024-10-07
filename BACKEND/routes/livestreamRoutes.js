// Backend/routes/livestreamRoutes.js;
const express = require('express');
const router = express.Router();
const Livestream = require('../models/Livestream');
const authMiddleware = require('../middleware/authMiddleware');
const { createLiveBroadcast, endLiveBroadcast } = require('../services/youtubeService');

// Create a livestream
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, startTime, endTime } = req.body;

    // Create live broadcast on YouTube
    const { broadcastId, streamUrl } = await createLiveBroadcast(title, description, startTime, endTime);

    const newLivestream = new Livestream({
      title,
      description,
      streamUrl: `https://www.youtube.com/watch?v=${broadcastId}`, // YouTube livestream URL
      startTime,
      endTime,
      createdBy: req.user.id,
      youtubeBroadcastId: broadcastId, // Store YouTube broadcast ID
    });

    const livestream = await newLivestream.save();
    res.json(livestream);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all livestreams
router.get('/', async (req, res) => {
  try {
    const livestreams = await Livestream.find().sort({ startTime: -1 }).populate('createdBy', 'name');
    res.json(livestreams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a livestream
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, startTime, endTime } = req.body;
    const livestream = await Livestream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({ msg: 'Livestream not found' });
    }

    // Check user authorization
    if (livestream.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Optionally, update the YouTube broadcast if needed
    // This requires implementing an update function in youtubeService.js

    livestream.title = title;
    livestream.description = description;
    livestream.startTime = startTime;
    livestream.endTime = endTime;

    await livestream.save();

    res.json(livestream);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a livestream
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const livestream = await Livestream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({ msg: 'Livestream not found' });
    }

    // Check user authorization
    if (livestream.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // End the YouTube broadcast
    if (livestream.youtubeBroadcastId) {
      await endLiveBroadcast(livestream.youtubeBroadcastId);
    }

    await livestream.remove();

    res.json({ msg: 'Livestream removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
