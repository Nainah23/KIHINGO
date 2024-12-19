import React, { useEffect, useRef, useState } from 'react';
import { Device } from 'mediasoup-client';
import { Camera, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import axios from 'axios';

// Create axios instance with interceptor to always get fresh token
const createAPI = () => {
  const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Add request interceptor to always get fresh token
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  return api;
};

const BrowserStreaming = ({ streamId, isPublisher, roomId, onStreamEnd }) => {
  const api = createAPI();
  const [device, setDevice] = useState(null);
  const [transport, setTransport] = useState(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [consumers, setConsumers] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isDeviceSelectionOpen, setIsDeviceSelectionOpen] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const videoRef = useRef(null);
  const initialized = useRef(false);
  const stopStreamingCalled = useRef(false);

  // Fetch available video devices
  const getVideoDevices = async () => {
    try {
      // Request initial permissions for video and audio
      console.log('Requesting video devices...');
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('Available devices:', devices);
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');
      setVideoDevices(videoInputs);
      console.log('Video devices:', videoInputs);

      if (!selectedDeviceId && videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting video devices:', err);
      setError('Unable to access camera devices. Please check permissions.');
    }
  };

  useEffect(() => {
    if (isPublisher) {
      getVideoDevices();
      navigator.mediaDevices.addEventListener('devicechange', getVideoDevices);

      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', getVideoDevices);
      };
    }
  }, [isPublisher]);

  useEffect(() => {
    if (!initialized.current && streamId && roomId) {
      initialized.current = true;
      initializeStreaming();
    }

    return () => {
      if (!stopStreamingCalled.current) {
        stopStreaming();
      }
    };
  }, [streamId, roomId]);

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const getMediaConstraints = () => {
    const constraints = {
      audio: true,
      video: {
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { ideal: 'user' }
      },
    };

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      constraints.video.facingMode = { ideal: 'user' }; // Use front camera for mobile
    }

    return constraints;
  };

  const initializeStreaming = async () => {
    try {
      console.log('Initializing streaming with:', { streamId, roomId, isPublisher });

      if (!streamId || !roomId) {
        throw new Error('Stream ID and Room ID are required');
      }

      // Verify token before proceeding
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      // Get capabilities with explicit error handling
      const { data: response } = await api.get('/livestream/capabilities');
      console.log('Capabilities response:', response);

      if (!response.success || !response.data) {
        throw new Error('Failed to get router capabilities');
      }

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
      
      // Enhanced error handling
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        // Optionally trigger logout or refresh token
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this stream.');
      } else {
        setError(`Failed to initialize streaming: ${err.message}`);
      }

      if (err.name === 'NotAllowedError') {
        setError('Please allow access to your camera and microphone to join the stream.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      }
    }
  };

  const initializePublisher = async (device) => {
    try {
      const mediaStream = await navigator.mediaDevices
        .getUserMedia(getMediaConstraints())
        .catch((err) => {
          if (err.name === 'NotAllowedError') {
            throw new Error('Please allow access to your camera and microphone to start streaming.');
          } else if (err.name === 'NotFoundError') {
            throw new Error('No camera found. Please connect a camera and try again.');
          }
          throw new Error(`Media access denied: ${err.message}`);
        });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const { data: response } = await api.post('/livestream/transport', {
        sctpCapabilities: device.sctpCapabilities,
        roomId: roomId,
        streamId: streamId,
        producing: true,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to create transport');
      }

      const sendTransport = device.createSendTransport(response.data);

      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          const { data: connectResponse } = await api.post(
            `/livestream/transport/${sendTransport.id}/connect`,
            { dtlsParameters, roomId, streamId }
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

      sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const { data } = await api.post(`/livestream/transport/${sendTransport.id}/produce`, {
            kind,
            rtpParameters,
            roomId,
            streamId,
          });

          if (!data.success || !data.data?.id) {
            throw new Error('Failed to produce media');
          }

          callback({ id: data.data.id });
        } catch (error) {
          console.error('Produce error:', error);
          errback(error);
        }
      });

      setTransport(sendTransport);

      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];

      if (videoTrack) {
        await sendTransport.produce({ track: videoTrack });
      }
      if (audioTrack) {
        await sendTransport.produce({ track: audioTrack });
      }
    } catch (err) {
      console.error('Publisher initialization error:', err);
      setError(`Failed to initialize publisher: ${err.message}`);
      throw err;
    }
  };

  const initializeViewer = async (device) => {
    try {
      console.log('Initializing viewer with streamId:', streamId);
      
      const { data: transportData } = await api.post('/livestream/transport', {
        sctpCapabilities: device.sctpCapabilities,
        roomId: roomId,
        streamId: streamId,
        producing: false
      });

      if (!transportData.success || !transportData.data) {
        throw new Error('Failed to create receive transport');
      }

      const recvTransport = device.createRecvTransport(transportData.data);

      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          const { data: connectResponse } = await api.post(
            `/livestream/transport/${recvTransport.id}/connect`,
            { 
              dtlsParameters,
              roomId,
              streamId
            }
          );

          if (!connectResponse.success) {
            throw new Error('Failed to connect transport');
          }

          callback();
        } catch (error) {
          console.error('Viewer transport connect error:', error);
          errback(error);
        }
      });

      setTransport(recvTransport);

      // Create MediaStream to hold received tracks
      const remoteStream = new MediaStream();
      setStream(remoteStream);

      // Get producer IDs for the stream
      const { data: producersResponse } = await api.get(`/livestream/${streamId}/producers`);
      
      if (!producersResponse.success || !producersResponse.data) {
        throw new Error('Failed to get producer IDs');
      }

      console.log('Retrieved producers:', producersResponse.data);

      // Consume each producer
      const newConsumers = await Promise.all(
        producersResponse.data.map(async (producerId) => {
          const { data: consumerData } = await api.post(
            `/livestream/transport/${recvTransport.id}/consume`,
            {
              producerId,
              rtpCapabilities: device.rtpCapabilities,
              streamId: streamId,
              roomId: roomId
            }
          );

          if (!consumerData.success || !consumerData.data) {
            throw new Error('Failed to create consumer');
          }

          const consumer = await recvTransport.consume({
            id: consumerData.data.id,
            producerId: consumerData.data.producerId,
            kind: consumerData.data.kind,
            rtpParameters: consumerData.data.rtpParameters
          });

          // Add track to stream
          remoteStream.addTrack(consumer.track);

          return consumer;
        })
      );

      setConsumers(newConsumers);

      // Set the stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
        console.log('Set remote stream to video element');
      }

    } catch (err) {
      console.error('Viewer initialization error:', err);
      setError('Failed to initialize viewer: ' + err.message);
    }
  };

  const stopStreaming = () => {
    try {
      stopStreamingCalled.current = true;
      console.log('Stopping stream...');

      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
      }

      if (transport) {
        transport.close();
        console.log('Closed transport');
      }

      consumers.forEach((consumer) => {
        consumer.close();
        console.log('Closed consumer');
      });

      setStream(null);
      setTransport(null);
      setConsumers([]);

      if (typeof onStreamEnd === 'function') {
        onStreamEnd();
      }

      console.log('Stream cleanup completed');
    } catch (err) {
      console.error('Error stopping stream:', err);
      setError('Failed to stop streaming: ' + err.message);
    }
  };

  return (
    <div className="browser-streaming relative">
      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isPublisher}
        className="streaming-video w-full h-full object-cover"
      />
      {isPublisher && (
        <div className="streaming-controls absolute bottom-4 left-4 flex gap-2">
          <button 
            onClick={toggleVideo}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
              isVideoEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
            } text-white`}
          >
            {isVideoEnabled ? <Video /> : <VideoOff />}
            </button>
          <button 
            onClick={toggleAudio}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
              isAudioEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
            } text-white`}
          >
            {isAudioEnabled ? <Mic /> : <MicOff />}
            </button>
          <button 
            onClick={() => setIsDeviceSelectionOpen(!isDeviceSelectionOpen)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
          >
            <Camera size={20} />
          </button>
          <button 
            onClick={stopStreaming} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            Stop Streaming
          </button>
        </div>
      )}
      
      {isDeviceSelectionOpen && (
        <div className="device-selection absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Select Camera</h3>
          {videoDevices.map(device => (
            <button
              key={device.deviceId}
              onClick={() => {
                setSelectedDeviceId(device.deviceId);
                setIsDeviceSelectionOpen(false);
                initializeStreaming();
              }}
              className={`block w-full text-left px-4 py-2 rounded hover:bg-gray-100 ${
                selectedDeviceId === device.deviceId ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowserStreaming;
