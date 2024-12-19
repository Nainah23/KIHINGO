// FRONTEND/src/pages/Livestream.js;
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import BrowserStreaming from '../components/BrowserStreaming';
import "../styles/Livestream.css";

const Livestream = () => {
  const [livestreams, setLivestreams] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newStream, setNewStream] = useState({ title: '', description: '', startTime: '', endTime: '' });
  const [activeStream, setActiveStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);  
  const [isPublisher, setIsPublisher] = useState(false);
  const { user, loading: authLoading, logout } = useContext(AuthContext);

  // Configure axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    }
  }, []);

  const fetchLivestreams = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/livestream', {
        headers: { 'x-auth-token': token }
      });
      
      // Ensure we store the roomId from each stream
      const streamsWithRoomIds = res.data.data.map(stream => ({
        ...stream,
        roomId: stream.roomId || null
      }));
      
      setLivestreams(streamsWithRoomIds);
      setError(null);
    } catch (err) {
      console.error('Error fetching livestreams:', err);
      setError('Failed to fetch livestreams. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLivestreams();
    // Set up polling for live updates
    const pollInterval = setInterval(fetchLivestreams, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, []);

  const handleCreateStream = async (e) => {
    e.preventDefault();
    setError(null);
  
    if (!user || (user.role !== 'admin' && user.role !== 'reverend')) {
      setError('You do not have permission to create a livestream.');
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token is missing.');
        return;
      }
  
      const startDate = new Date(newStream.startTime);
      const endDate = new Date(newStream.endTime);
      const now = new Date();
  
      if (startDate < now) {
        setError('Start time must be in the future.');
        return;
      }
  
      if (endDate <= startDate) {
        setError('End time must be after start time.');
        return;
      }
  
      const formattedStream = {
        ...newStream,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString()
      };
  
      const response = await axios.post(
        'http://localhost:8000/api/livestream',
        formattedStream,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );
  
      const createdStream = response.data.data;
      const newRoomId = createdStream.roomId;
      
      // Store the roomId in state and update livestreams array
      setRoomId(newRoomId);
      setLivestreams(prevStreams => [...prevStreams, { ...createdStream, roomId: newRoomId }]);
      setNewStream({ title: '', description: '', startTime: '', endTime: '' });
      setIsCreating(false);
      setError(null);
  
      console.log('Stream created with Room ID:', newRoomId);
    } catch (err) {
      console.error('Error creating stream:', err);
      setError(err.response?.data?.msg || 'Failed to create livestream. Please try again.');
    }
  };

  const joinStream = async (streamId, roomId) => {
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }
  
      if (!streamId || !roomId) {
        setError('Invalid stream or room ID.');
        return;
      }
  
      console.log('Attempting to join stream:', streamId, 'with room:', roomId);
  
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
  
      if (response.data.success) {
        setActiveStream(streamId);
        setRoomId(roomId);
        // Set isPublisher based on user role
        setIsPublisher(user?.role === 'admin' || user?.role === 'reverend');
        console.log('Successfully joined stream with room ID:', roomId);
      } else {
        throw new Error(response.data.msg || 'Failed to join stream');
      }

      return { streamId, roomId };
    } catch (err) {
      console.error('Error joining stream:', err);
      const errorMsg = err.response?.data?.msg || err.message || 'Failed to join livestream';
      setError(errorMsg);
      setActiveStream(null);
      setRoomId(null);
      setIsPublisher(false);
    }
  };
  
  const leaveStream = async (streamId) => {
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }
  
      if (!streamId || !roomId) {
        setError('Invalid stream or room ID.');
        return;
      }
  
      const response = await axios.put(
        `http://localhost:8000/api/livestream/${streamId}/status`,
        { 
          status: 'ended',
          roomId: roomId // Include roomId when leaving
        },
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.success) {
        setActiveStream(null);
        setRoomId(null);
        await fetchLivestreams(); // Refresh the streams list
      } else {
        throw new Error(response.data.msg || 'Failed to leave stream');
      }
    } catch (err) {
      console.error('Error leaving stream:', err);
      const errorMsg = err.response?.data?.msg || err.message || 'Failed to leave livestream';
      setError(errorMsg);
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewStream({ title: '', description: '', startTime: '', endTime: '' });
    setError(null);
  };

  const now = new Date();
  const ongoingStreams = livestreams.filter(stream => 
    stream.status === 'streaming' || 
    (new Date(stream.startTime) <= now && new Date(stream.endTime) >= now)
  );
  const scheduledStreams = livestreams.filter(stream => 
    stream.status === 'created' && new Date(stream.startTime) > now
  );
  const pastStreams = livestreams.filter(stream =>
    stream.status === 'ended' || new Date(stream.endTime) < now
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="livestream-container max-w-6xl mx-auto px-4 py-8">
      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="header flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Church Livestreams</h1>
        <div className="flex gap-4">
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'reverend') && (
                <button
                  onClick={() => setIsCreating(!isCreating)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                >
                  {isCreating ? 'Cancel' : 'Create New Livestream'}
                </button>
              )}
              <button
                onClick={logout}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              Login
            </a>
          )}
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateStream} className="create-stream-form bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Title
            </label>
            <input
              type="text"
              placeholder="Enter livestream title"
              value={newStream.title}
              onChange={(e) => setNewStream({...newStream, title: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              placeholder="Enter livestream description"
              value={newStream.description}
              onChange={(e) => setNewStream({...newStream, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={newStream.startTime}
                onChange={(e) => setNewStream({...newStream, startTime: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                value={newStream.endTime}
                onChange={(e) => setNewStream({...newStream, endTime: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancelCreate}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
            >
              Create Livestream
            </button>
          </div>
        </form>
      )}

      {activeStream && roomId && (
        <div className="active-stream-container bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Active Stream
            </h2>
          </div>
          <div className="aspect-w-16 aspect-h-9">
            <BrowserStreaming 
              streamId={activeStream}
              isPublisher={isPublisher}
              roomId={roomId}
              onStreamEnd={() => {
                // Your stream end handling logic here
                console.log('Stream ended');
              }}
            />
          </div>
          <div className="p-4">
            <button
              onClick={() => leaveStream(activeStream)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            >
              Leave Stream
            </button>
          </div>
        </div>
      )}

      <div className="stream-sections space-y-8">
        {ongoingStreams.length > 0 && (
          <section className="ongoing-streams">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ongoing Livestreams</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ongoingStreams.map(stream => (
                <div key={stream._id} className="stream-card bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{stream.title}</h3>
                    <p className="text-gray-600 mb-4">{stream.description}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Started: {new Date(stream.startTime).toLocaleString()}
                    </p>
                    {!activeStream && (
                      <button
                        onClick={() => joinStream(stream._id, stream.roomId)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                      >
                        Join Stream
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {scheduledStreams.length > 0 && (
          <section className="scheduled-streams">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Scheduled Livestreams</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {scheduledStreams.map(stream => (
                <div key={stream._id} className="stream-card bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{stream.title}</h3>
                    <p className="text-gray-600 mb-4">{stream.description}</p>
                    <p className="text-sm text-gray-500">
                      Starts: {new Date(stream.startTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pastStreams.length > 0 && (
        <div className="past-streams">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Past Streams</h2>
        {pastStreams.map(stream => (
          <div key={stream._id} className="stream-card bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-bold">{stream.title}</h3>
            <p className="text-gray-700">{stream.description}</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-gray-500">{new Date(stream.endTime).toLocaleString()}</span>
            </div>
          </div>
        ))}
        </div>
        )}
        </div>
        </div>
        );
        };

export default Livestream;