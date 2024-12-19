// BACKEND/routes/livestreamRoutes.js
const express = require('express');
const router = express.Router();
const Livestream = require('../models/Livestream');
const authMiddleware = require('../middleware/authMiddleware');
const mediasoup = require('mediasoup');
const config = require('../config/config');
const { v4: uuidv4 } = require('uuid'); // Add this for generating unique IDs


let worker = null;
let mediaSoupRouter = null;
let transports = new Map();


// Initialize MediaSoup worker
const initializeMediaSoup = async () => {
  try {
    if (!worker) {
      worker = await mediasoup.createWorker({
        logLevel: 'warn',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
        rtcMinPort: 40000,
        rtcMaxPort: 49999,
      });

      console.log('MediaSoup worker created');

      worker.on('died', () => {
        console.error('MediaSoup worker died, attempting to restart...');
        worker = null;
        mediaSoupRouter = null;
        initializeMediaSoup();
      });

      mediaSoupRouter = await worker.createRouter({
        mediaCodecs: [
          {
            kind: 'video',
            mimeType: 'video/VP8',
            clockRate: 90000,
            parameters: {
              'x-google-start-bitrate': 1000
            }
          },
          {
            kind: 'audio',
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2
          }
        ]
      });

      console.log('MediaSoup router created');
    }
    return mediaSoupRouter;
  } catch (error) {
    console.error('Failed to initialize MediaSoup:', error);
    throw error;
  }
};

// Ensure router is initialized
const getRouter = async () => {
  if (!mediaSoupRouter) {
    await initializeMediaSoup();
  }
  return mediaSoupRouter;
};

// Create a new livestream
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'reverend') {
      return res.status(403).json({ 
        success: false, 
        msg: 'Insufficient permissions' 
      });
    }

    const { title, description, startTime, endTime } = req.body;

    if (!title || !description || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Missing required fields.' 
      });
    }

    const roomId = uuidv4(); // Generate a unique roomId for the stream

    const newLivestream = new Livestream({
      title,
      description,
      startTime,
      endTime,
      createdBy: req.user.id,
      status: 'created',
      roomId // Store the roomId in the database
    });

    const livestream = await newLivestream.save();
    res.json({ 
      success: true, 
      data: { ...livestream.toObject(), roomId } // Return roomId in the response
    });
  } catch (err) {
    console.error('Livestream creation error:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// Get WebRTC capabilities
router.get('/capabilities', authMiddleware, async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        msg: 'Authentication required'
      });
    }

    // Check if mediaSoupRouter is initialized
    if (!mediaSoupRouter) {
      await initializeMediaSoup();
    }

    const capabilities = mediaSoupRouter.rtpCapabilities;
    res.json({
      success: true,
      data: capabilities
    });
  } catch (error) {
    console.error('Error getting capabilities:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to get capabilities',
      error: error.message
    });
  }
});

// Create WebRTC transport
router.post('/transport', authMiddleware, async (req, res) => {
  try {
    const { sctpCapabilities } = req.body;
    
    const router = await getRouter();
    
    const transport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: config.MEDIASOUP_LISTEN_IP || '0.0.0.0', // Fallback to all interfaces
          announcedIp: config.MEDIASOUP_ANNOUNCED_IP || null // Will use connect IP if null
        }
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
      enableSctp: true,
      numSctpStreams: { OS: 1024, MIS: 1024 }
    });

    // Store transport with user ID
    const transportId = transport.id;
    transports.set(transportId, {
      transport,
      userId: req.user.id
    });

    console.log(`Created transport ${transportId} for user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        sctpParameters: transport.sctpParameters
      }
    });
  } catch (error) {
    console.error('Transport creation error:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to create transport',
      error: error.message
    });
  }
});

// Connect transport
router.post('/transport/:transportId/connect', authMiddleware, async (req, res) => {
  try {
    const { transportId } = req.params;
    const { dtlsParameters } = req.body;

    console.log(`Connecting transport ${transportId} for user ${req.user.id}`);

    // Get transport from storage
    const transportData = transports.get(transportId);
    
    if (!transportData) {
      throw new Error(`Transport ${transportId} not found`);
    }

    const { transport, userId } = transportData;

    // Verify transport belongs to user
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'Not authorized to access this transport'
      });
    }

    await transport.connect({ dtlsParameters });
    
    console.log(`Transport ${transportId} connected successfully`);

    res.json({ success: true });
  } catch (error) {
    console.error('Transport connect error:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to connect transport',
      error: error.message
    });
  }
});

// Produce media
router.post('/transport/:transportId/produce', authMiddleware, async (req, res) => {
  try {
    const { transportId } = req.params;
    const { kind, rtpParameters } = req.body;

    const transportData = transports.get(transportId);
    if (!transportData) {
      throw new Error(`Transport ${transportId} not found`);
    }

    const { transport, userId } = transportData;

    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'Not authorized to access this transport'
      });
    }

    const producer = await transport.produce({
      kind,
      rtpParameters
    });

    console.log(`Created ${kind} producer ${producer.id} on transport ${transportId}`);

    res.json({
      success: true,
      data: {
        id: producer.id
      }
    });
  } catch (error) {
    console.error('Produce error:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to produce media',
      error: error.message
    });
  }
});

// Clean up transports periodically
setInterval(() => {
  for (const [transportId, transportData] of transports.entries()) {
    const { transport } = transportData;
    if (transport.closed) {
      transports.delete(transportId);
      console.log(`Cleaned up closed transport ${transportId}`);
    }
  }
}, 60000);

// Get producers for a stream
router.get('/:streamId/producers', authMiddleware, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    // Get producers associated with this stream from your storage
    const producers = await Livestream.findById(streamId).select('producers');
    
    res.json({
      success: true,
      data: producers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Failed to get producers',
      error: error.message
    });
  }
});

// Consume media
router.post('/transport/:transportId/consume', authMiddleware, async (req, res) => {
  try {
    const { producerId, rtpCapabilities, streamId } = req.body;
    const transport = router.getTransport(req.params.transportId);
    
    // Check if the consumer can consume the producer
    if (!router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error('Cannot consume the producer');
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false // You might want to start paused and explicitly resume
    });

    res.json({
      success: true,
      data: {
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Failed to consume media',
      error: error.message
    });
  }
});

// Get all livestreams
router.get('/', async (req, res) => {
  try {
    const livestreams = await Livestream.find().populate('createdBy', 'name username').exec();
    res.json({ 
      success: true, 
      data: livestreams 
    });
  } catch (err) {
    console.error('Livestreams retrieval error:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});


// Update livestream status (join stream)
router.put('/:streamId/status', authMiddleware, async (req, res) => {
  try {
    const { streamId } = req.params;
    const { status, roomId } = req.body;

    if (!streamId || !status || !roomId) {
      return res.status(400).json({ 
        success: false, 
        msg: 'StreamId, status, and roomId are required.' 
      });
    }

    // Verify user permissions
    if (req.user.role !== 'admin' && req.user.role !== 'reverend') {
      return res.status(403).json({ 
        success: false, 
        msg: 'Insufficient permissions' 
      });
    }

    const livestream = await Livestream.findById(streamId);
    
    if (!livestream) {
      return res.status(404).json({ 
        success: false, 
        msg: 'Livestream not found.' 
      });
    }

    // Verify stream ownership or admin status
    if (livestream.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        msg: 'Not authorized to modify this stream' 
      });
    }

    // Update stream status
    livestream.status = status;
    livestream.roomId = roomId;
    await livestream.save();

    res.json({ 
      success: true, 
      data: livestream 
    });
  } catch (err) {
    console.error('Error updating livestream status:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});


module.exports = router;