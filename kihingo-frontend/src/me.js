// BACKEND/routes/livestreamRoutes.js

// Update the transport creation endpoint to properly handle auth and validate input
router.post('/transport', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        msg: 'User authentication required'
      });
    }

    const { sctpCapabilities } = req.body;
    
    if (!sctpCapabilities) {
      return res.status(400).json({
        success: false,
        msg: 'SCTP capabilities are required'
      });
    }

    if (!mediaSoupRouter) {
      await initializeMediaSoup();
      if (!mediaSoupRouter) {
        throw new Error('MediaSoup router initialization failed');
      }
    }

    const transport = await mediaSoupRouter.createWebRtcTransport({
      listenIps: [
        {
          ip: config.MEDIASOUP_LISTEN_IP,
          announcedIp: config.MEDIASOUP_ANNOUNCED_IP
        }
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
      enableSctp: true,
      numSctpStreams: sctpCapabilities
    });

    // Store transport in memory mapped to user
    if (!global.userTransports) {
      global.userTransports = new Map();
    }
    global.userTransports.set(req.user.id, transport);

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

// Update the stream joining endpoint
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

// FRONTEND/src/components/BrowserStreaming.js
const BrowserStreaming = ({ streamId, isPublisher, roomId }) => {  // Add roomId prop
  // ... existing state declarations ...

  const initializeStreaming = async () => {
    try {
      // Verify we have the required props
      if (!streamId || !roomId) {
        throw new Error('Stream ID and Room ID are required');
      }

      // Get router RTP capabilities with error handling
      const { data: response } = await api.get('/livestream/capabilities');
      
      if (!response.success || !response.data) {
        throw new Error('Failed to get router capabilities');
      }

      // Create device with error handling
      const newDevice = new Device();
      await newDevice.load({ routerRtpCapabilities: response.data });
      setDevice(newDevice);

      if (isPublisher) {
        await initializePublisher(newDevice);
      } else {
        await initializeViewer(newDevice);
      }
    } catch (err) {
      console.error('Streaming initialization error:', err);
      setError(`Failed to initialize streaming: ${err.message}`);
    }
  };

  const initializePublisher = async (device) => {
    try {
      // Request user media with error handling
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      }).catch(err => {
        throw new Error(`Media access denied: ${err.message}`);
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Create transport with error handling
      const { data: response } = await api.post('/livestream/transport', {
        sctpCapabilities: device.sctpCapabilities,
        roomId: roomId  // Include roomId in transport creation
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to create transport');
      }

      const sendTransport = device.createSendTransport(response.data);
      
      // Set up transport event handlers
      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          const { data: connectResponse } = await api.post(
            `/livestream/transport/${sendTransport.id}/connect`,
            { dtlsParameters }
          );

          if (!connectResponse.success) {
            throw new Error('Transport connection failed');
          }
          
          callback();
        } catch (error) {
          console.error('Transport connect error:', error);
          errback(error);
        }
      });

      // ... rest of the initializePublisher implementation ...
    } catch (err) {
      console.error('Publisher initialization error:', err);
      setError(`Failed to initialize publisher: ${err.message}`);
      throw err;  // Propagate error for proper handling
    }
  };

  // ... rest of the component implementation ...
};

// FRONTEND/src/pages/Livestream.js
const joinStream = async (streamId, roomId) => {
  if (!streamId || !roomId) {
    setError('Stream ID and Room ID are required');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    setError('Authentication token is missing');
    return;
  }

  try {
    console.log(`Attempting to join stream: ${streamId} with room: ${roomId}`);

    const response = await axios.put(
      `http://localhost:8000/api/livestream/${streamId}/status`,
      { 
        status: 'streaming', 
        roomId: roomId 
      },
      {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.msg || 'Failed to join stream');
    }

    console.log('Successfully joined stream with room ID:', roomId);
    setActiveStream(streamId);
    setRoomId(roomId);
    
    // Pass both streamId and roomId to BrowserStreaming
    return { streamId, roomId };
  } catch (err) {
    console.error('Error joining stream:', err);
    const errorMsg = err.response?.data?.msg || 'Failed to join livestream';
    setError(errorMsg);
    throw new Error(errorMsg);
  }
};