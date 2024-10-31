import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import "../styles/Livestream.css";

const Livestream = () => {
  const [livestreams, setLivestreams] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newStream, setNewStream] = useState({ title: '', description: '', startTime: '', endTime: '' });
  const { user, loading, logout } = useContext(AuthContext);

  useEffect(() => {
    fetchLivestreams();
  }, []);

  const fetchLivestreams = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/livestream');
      setLivestreams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStream = async (e) => {
    e.preventDefault();
    if (user?.role !== 'admin' && user?.role !== 'reverend') {
      alert('You do not have permission to create a livestream.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/livestream', newStream, {
        headers: { 'x-auth-token': token }
      });
      setIsCreating(false);
      setNewStream({ title: '', description: '', startTime: '', endTime: '' });
      fetchLivestreams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const now = new Date();
  const ongoingStreams = livestreams.filter(stream => new Date(stream.startTime) <= now && new Date(stream.endTime) >= now);
  const scheduledStreams = livestreams.filter(stream => new Date(stream.startTime) > now);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="livestream-container">
      <div className="header">
        <h2>Church Livestreams</h2>
        {user ? (
          <>
            {(user.role === 'admin' || user.role === 'reverend') && (
              <button onClick={() => setIsCreating(!isCreating)}>
                {isCreating ? 'Cancel' : 'Create New Livestream'}
              </button>
            )}
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <a href="/login">Login</a>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleCreateStream} className="create-stream-form">
          <input
            type="text"
            placeholder="Title"
            value={newStream.title}
            onChange={(e) => setNewStream({...newStream, title: e.target.value})}
            required
          />
          <textarea
            placeholder="Description"
            value={newStream.description}
            onChange={(e) => setNewStream({...newStream, description: e.target.value})}
            required
          />
          <input
            type="datetime-local"
            value={newStream.startTime}
            onChange={(e) => setNewStream({...newStream, startTime: e.target.value})}
            required
          />
          <input
            type="datetime-local"
            value={newStream.endTime}
            onChange={(e) => setNewStream({...newStream, endTime: e.target.value})}
            required
          />
          <button type="submit">Create Livestream</button>
        </form>
      )}

      <div className="ongoing-streams">
        <h3>Ongoing Livestreams</h3>
        {ongoingStreams.map(stream => (
          <div key={stream._id} className="livestream">
            <h3>{stream.title}</h3>
            <p>{stream.description}</p>
            <p>Started at: {new Date(stream.startTime).toLocaleString()}</p>
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

      <div className="scheduled-streams">
        <h3>Scheduled Livestreams</h3>
        {scheduledStreams.map(stream => (
          <div key={stream._id} className="scheduled-livestream">
            <h3>{stream.title}</h3>
            <p>{stream.description}</p>
            <p>Start Time: {new Date(stream.startTime).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Livestream;
