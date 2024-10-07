// src/pages/Livestream.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Livestream = () => {
  const [livestreams, setLivestreams] = useState([]);

  useEffect(() => {
    const fetchLivestreams = async () => {
      try {
        const res = await axios.get('/api/livestream');
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