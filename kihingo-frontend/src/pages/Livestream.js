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

    // Check if the user has the required role
    if (user?.role !== 'admin' && user?.role !== 'pastor') {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="livestream-container">
      <div className="header">
        <h2>Church Livestreams</h2>
        {user ? (
          <>
            {/* Only show the create button if the user has the appropriate role */}
            {(user.role === 'admin' || user.role === 'pastor') && (
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

      {isCreating && user && (
        <form onSubmit={handleCreateStream}>
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

      {livestreams.map(stream => (
        <div key={stream._id} className="livestream">
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
