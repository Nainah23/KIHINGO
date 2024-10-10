// src/pages/Feed.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../styles/Feed.css";

const Feed = () => {
  const [feeds, setFeeds] = useState([]);

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/feed');
        setFeeds(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFeeds();
  }, []);

  return (
    <div>
      <h2>Church Feed</h2>
      {feeds.map(feed => (
        <div key={feed._id}>
          <p>{feed.content}</p>
          <p>Posted by: {feed.user.name}</p>
        </div>
      ))}
    </div>
  );
};

export default Feed;
