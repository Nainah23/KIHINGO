// BACKEND/routes/livestreamRoutes.js
const express = require('express');
const router = express.Router();
const Livestream = require('../models/Livestream');
const authMiddleware = require('../middleware/authMiddleware');
const { createLiveBroadcast, startStreaming, endLiveBroadcast } = require('../services/youtubeService');

// Create a livestream
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, startTime, endTime, inputSource } = req.body;

    // Create live broadcast on YouTube
    const { broadcastId, streamUrl, streamKey } = await createLiveBroadcast(
      title, 
      description, 
      startTime, 
      endTime
    );

    // Start streaming if inputSource is provided
    if (inputSource) {
      await startStreaming(inputSource, streamUrl, streamKey);
    }

    const newLivestream = new Livestream({
      title,
      description,
      streamUrl: `https://www.youtube.com/watch?v=${broadcastId}`,
      startTime,
      endTime,
      createdBy: req.user.id,
      youtubeBroadcastId: broadcastId,
      streamKey, // Save stream key if you need it later
    });

    const livestream = await newLivestream.save();
    res.json(livestream);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Start streaming for an existing livestream
router.post('/:id/start', authMiddleware, async (req, res) => {
  try {
    const { inputSource } = req.body;
    const livestream = await Livestream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({ msg: 'Livestream not found' });
    }

    if (livestream.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await startStreaming(inputSource, livestream.streamUrl, livestream.streamKey);
    res.json({ msg: 'Streaming started successfully' });
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

    if (livestream.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

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

    if (livestream.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

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


// BACKEND/services/youtubeService.js
const YouTubeLiveStream = require('youtube-live-streaming');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const TOKEN_PATH = path.join(__dirname, '../config/official-channel-tokens.json');

// Load client credentials and set up OAuth2 client
async function getOAuth2Client() {
    const { client_id, client_secret, redirect_uris } = require('../config/oauth2-credentials.json').web;
    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    let tokens;
    if (fs.existsSync(TOKEN_PATH)) {
        tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    } else {
        tokens = {
            access_token: process.env.OAUTH_ACCESS_TOKEN,
            refresh_token: process.env.OAUTH_REFRESH_TOKEN,
        };
    }

    oauth2Client.setCredentials(tokens);

    oauth2Client.on('tokens', (newTokens) => {
        if (newTokens.refresh_token) {
            tokens.refresh_token = newTokens.refresh_token;
        }
        tokens.access_token = newTokens.access_token;
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    });

    return oauth2Client;
}

// Initialize YouTube Live instance
async function getYouTubeLive() {
    const authClient = await getOAuth2Client();
    return new YouTubeLiveStream(authClient);
}

const createLiveBroadcast = async (title, description, startTime, endTime) => {
    try {
        const youtubeLive = await getYouTubeLive();
        
        // Create broadcast
        const broadcast = await youtubeLive.createBroadcast({
            snippet: {
                title,
                description,
                scheduledStartTime: startTime,
                scheduledEndTime: endTime,
            },
            status: {
                privacyStatus: 'public',
                selfDeclaredMadeForKids: false,
            },
            contentDetails: {
                enableAutoStart: true,
                enableAutoStop: true,
                enableDvr: true,
                recordFromStart: true,
            },
        });

        // Create stream
        const stream = await youtubeLive.createStream({
            snippet: {
                title: `${title} Stream`,
            },
            cdn: {
                frameRate: '60fps',
                ingestionType: 'rtmp',
                resolution: '1080p',
            },
        });

        // Bind broadcast and stream
        await youtubeLive.bindBroadcastToStream(broadcast.id, stream.id);

        return {
            broadcastId: broadcast.id,
            streamUrl: stream.cdn.ingestionAddress,
            streamKey: stream.cdn.streamName,
            broadcast,
            stream,
        };
    } catch (error) {
        console.error('Error creating live broadcast:', error);
        throw error;
    }
};

const startStreaming = async (inputSource, streamUrl, streamKey) => {
    return new Promise((resolve, reject) => {
        const rtmpUrl = `${streamUrl}/${streamKey}`;
        
        const stream = ffmpeg(inputSource)
            .inputOptions([
                '-re', // Read input at native framerate
                '-stream_loop -1', // Loop the input indefinitely
            ])
            .outputOptions([
                '-c:v libx264', // Video codec
                '-preset veryfast', // Encoding preset
                '-b:v 6000k', // Video bitrate
                '-maxrate 6000k',
                '-bufsize 12000k',
                '-acodec aac', // Audio codec
                '-ar 44100', // Audio sample rate
                '-b:a 128k', // Audio bitrate
                '-f flv', // Output format
            ])
            .on('start', () => {
                console.log('Stream started:', rtmpUrl);
                resolve();
            })
            .on('error', (err) => {
                console.error('Streaming error:', err);
                reject(err);
            })
            .on('end', () => {
                console.log('Stream ended');
            });

        stream.save(rtmpUrl);
    });
};

const endLiveBroadcast = async (broadcastId) => {
    try {
        const youtubeLive = await getYouTubeLive();
        await youtubeLive.transitionBroadcast(broadcastId, 'complete');
    } catch (error) {
        console.error('Error ending live broadcast:', error);
        throw error;
    }
};

module.exports = {
    createLiveBroadcast,
    startStreaming,
    endLiveBroadcast,
};



// BACKEND/models/Livestream.js
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
    required: true,
  },
  youtubeBroadcastId: {
    type: String,
    required: true
  },
  streamKey: {
    type: String,
    required: true
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
  status: {
    type: String,
    enum: ['created', 'streaming', 'ended', 'error'],
    default: 'created'
  },
  streamingDetails: {
    rtmpUrl: String,
    streamKey: String,
    error: String
  }
}, {
  timestamps: true  // This replaces the manual createdAt and adds updatedAt
});

module.exports = mongoose.model('Livestream', LivestreamSchema);