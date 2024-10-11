// src/pages/Feed.js;
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext'; 
import '../styles/Feed.css';
import { useNavigate } from 'react-router-dom';

const Feed = () => {
  const { user } = useContext(AuthContext); 
  const [feeds, setFeeds] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [editPostId, setEditPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');
  const [lastVerseChange, setLastVerseChange] = useState(Date.now());
  const navigate = useNavigate();

  // Fetch feeds from the API
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

  // Fetch a random Bible verse
  const fetchBibleVerse = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/bible-verse');
      setBibleVerse(res.data.verse); 
    } catch (err) {
      console.error(err);
    }
  };

  // Effect to fetch Bible verse and update every 6 hours
  useEffect(() => {
    fetchBibleVerse();
    const interval = setInterval(() => {
      if (Date.now() - lastVerseChange >= 21600000) { 
        fetchBibleVerse();
        setLastVerseChange(Date.now());
      }
    }, 60000); 

    return () => clearInterval(interval);
  }, [lastVerseChange]);

  // Handle reactions to a post
  const handleReaction = async (feedId, reactionType) => {
    if (!user) {
      alert("Please login to react.");
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:8000/api/feed/${feedId}/react`, 
        { type: reactionType },
        { headers: { 'x-auth-token': token } }
      );
      
      // Update the feed with the updated reaction counts
      const updatedFeeds = feeds.map(feed => {
        if (feed._id === feedId) {
          const updatedReactions = feed.reactions.map(reaction => 
            reaction.type === reactionType
              ? { ...reaction, count: reaction.count + 1 }
              : reaction
          );
          return { ...feed, reactions: updatedReactions };
        }
        return feed;
      });
  
      setFeeds(updatedFeeds);
    } catch (err) {
      console.error(err);
    }
  };
  
  

  // Handle posting a new feed
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to create a post.");
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/feed', 
        { content: newPostContent },
        { headers: { 'x-auth-token': token } }
      );
      setNewPostContent('');
      const res = await axios.get('http://localhost:8000/api/feed');
      setFeeds(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle comment click
  const handleCommentClick = (feedId) => {
    navigate(`/comments/${feedId}`);
  };

  return (
    <div className="feed-container">
      <button className="back-home-button" onClick={() => navigate('/')}>Back Home</button>
      <div className="bible-verse-container">
        <div className="bible-verse-scroll">
          <span>{bibleVerse}</span>
        </div>
      </div>
      <h2>Church Feed</h2>

      {/* New Post Form */}
      {user ? (
        <form onSubmit={handlePostSubmit}>
          <input 
            type="text" 
            value={newPostContent} 
            onChange={(e) => setNewPostContent(e.target.value)} 
            placeholder="What's on your mind?"
          />
          <button type="submit">Post</button>
        </form>
      ) : (
        <p>Please log in to create a post.</p>
      )}

      {feeds.map(feed => (
        <div key={feed._id} className="feed-post">
          <p className="user-name">{feed.user.name}</p>
          <p className="content">{feed.content}</p>
          {feed.attachments && feed.attachments.length > 0 && (
            <div className="attachments">
              {feed.attachments.map((attachment, index) => (
                <img key={index} src={attachment} alt="Attachment" />
              ))}
            </div>
          )}
          
          <div className="reaction-section">
            {/* Display reaction counts */}
            <div className="reaction-buttons">
              <button className="reaction-button" onClick={() => handleReaction(feed._id, '👍')}>
                👍 {feed.reactions.filter(reaction => reaction.type === '👍').length}
              </button>
              <button className="reaction-button" onClick={() => handleReaction(feed._id, '❤️')}>
                ❤️ {feed.reactions.filter(reaction => reaction.type === '❤️').length}
              </button>
            </div>

            <button className="reply-button" onClick={() => handleCommentClick(feed._id)}>
              Reply
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Feed;