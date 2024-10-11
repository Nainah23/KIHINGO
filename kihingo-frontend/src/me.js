// src/pages/Livestream.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../styles/Livestream.css";

const Livestream = () => {
  const [livestreams, setLivestreams] = useState([]);

  useEffect(() => {
    const fetchLivestreams = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/livestream');
        setLivestreams(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLivestreams();
  }, []);

  return (
    <div>
      <h2>Church Livestreams</h2>
      {livestreams.map(stream => (
        <div key={stream._id}>
          <h3>{stream.title}</h3>
          <p>{stream.description}</p>
          <p>Start Time: {new Date(stream.startTime).toLocaleString()}</p>
          <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${stream.youtubeBroadcastId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ))}
    </div>
  );
};

export default Livestream;


/* src/styles/Livestream.css */
@import './common.css';

.livestream-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.livestream {
    width: 100%;
    max-width: 600px;
    margin: 20px 0;
}

@media (max-width: 768px) {
    .livestream iframe {
        width: 100%; /* Make iframe responsive */
        height: auto; /* Maintain aspect ratio */
    }
}


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


// BACKEND/services/youtubeService.js;
const { google } = require('googleapis');
const youtube = google.youtube('v3');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Function to create a live broadcast
const createLiveBroadcast = async (title, description, startTime, endTime) => {
  try {
    const broadcastResponse = await youtube.liveBroadcasts.insert({
      key: YOUTUBE_API_KEY,
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          scheduledStartTime: startTime,
          scheduledEndTime: endTime,
        },
        status: {
          privacyStatus: 'public', // or 'unlisted', 'private'
        },
      },
    });

    const broadcast = broadcastResponse.data;

    // Create a live stream
    const streamResponse = await youtube.liveStreams.insert({
      key: YOUTUBE_API_KEY,
      part: ['snippet', 'cdn'],
      requestBody: {
        snippet: {
          title: `${title} Stream`,
        },
        cdn: {
          format: '1080p',
          ingestionType: 'rtmp',
        },
      },
    });

    const stream = streamResponse.data;

    // Bind the live stream to the broadcast
    await youtube.liveBroadcasts.bind({
      key: YOUTUBE_API_KEY,
      part: ['id', 'snippet'],
      id: broadcast.id,
      streamId: stream.id,
      requestBody: {},
    });

    return {
      broadcastId: broadcast.id,
      streamUrl: stream.cdn.ingestionInfo.streamName, // or ingestionInfo.rtmpUrl
    };
  } catch (error) {
    console.error('Error creating live broadcast:', error);
    throw error;
  }
};

// Function to end a live broadcast
const endLiveBroadcast = async (broadcastId) => {
  try {
    await youtube.liveBroadcasts.transition({
      key: YOUTUBE_API_KEY,
      part: ['status'],
      id: broadcastId,
      broadcastStatus: 'complete',
      notifySubscribers: false,
    });
  } catch (error) {
    console.error('Error ending live broadcast:', error);
    throw error;
  }
};

module.exports = {
  createLiveBroadcast,
  endLiveBroadcast,
};


// BACKEND/models/Livestream.js;
const mongoose = require('mongoose');

const LivestreamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  streamUrl: {
    type: String,
    required: true, // URL to the YouTube livestream
  },
  youtubeBroadcastId: {
    type: String, // Store YouTube livestream ID (useful for fetching or updating streams)
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Livestream', LivestreamSchema);



HERE is my .env;
YOUTUBE_API_KEY=AIzaSyA9VcJpMV6gr0B5uaSvZxoHlD20XkqcPiM

