import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Bell, MessageCircle, ThumbsUp } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import '../styles/Feed.css';

// ... (keep all the existing utility functions and ApiService class) ...

// Main Feed Component
const Feed = () => {
  const { user } = useContext(AuthContext);
  const [feeds, setFeeds] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfileImage, setUserProfileImage] = useState('/default-profile.png');
  const [isScrolling, setIsScrolling] = useState(false);
  
  const navigate = useNavigate();
  const timeUpdateInterval = useRef(null);
  const emojiPickerRef = useRef(null);
  const scrollCount = useRef(0);
  const verseRef = useRef(null);
  const api = React.useMemo(() => new ApiService(navigate), [navigate]);

  // Add these new functions for Bible verse scrolling
  const startScrollAnimation = () => {
    setIsScrolling(true);
    if (verseRef.current) {
      verseRef.current.style.animation = 'none';
      // Properly trigger reflow
      void verseRef.current.offsetHeight;
      verseRef.current.style.animation = 'scrollVerse 15s linear';
    }
  };

  const handleScrollEnd = () => {
    scrollCount.current += 1;
    if (scrollCount.current < 2) {
      // Start another scroll cycle
      startScrollAnimation();
    } else {
      // After two complete scrolls, fetch new verse
      setIsScrolling(false);
      fetchBibleVerse();
    }
  };

  const fetchBibleVerse = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/bible-verse');
      // Only update verse if not currently scrolling
      if (!isScrolling) {
        setBibleVerse(response.data.verse);
        scrollCount.current = 0;
        startScrollAnimation();
      }
    } catch (error) {
      console.error('Error fetching Bible verse:', error);
      setBibleVerse('Unable to load verse at this time.');
    }
  };

  // ... (keep all the existing handler functions) ...

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load user profile image
        if (user?.profileImage) {
          const imageUrl = await api.getImageUrl(user.profileImage);
          setUserProfileImage(imageUrl);
        }

        // Fetch initial data
        const [feedsData, notificationsData] = await Promise.all([
          api.fetchFeeds(),
          api.fetchNotifications().catch(() => [])
        ]);

        setFeeds(feedsData);
        setNotifications(notificationsData);
        
        // Initialize Bible verse scroll
        fetchBibleVerse();

      } catch (err) {
        setError('Failed to load feed data. Please try refreshing the page.');
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    timeUpdateInterval.current = setInterval(() => {
      setFeeds(prevFeeds => [...prevFeeds]);
    }, 60000);

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, [user, navigate, api]);

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="feed-container">
      <div className="sidebar">
        {/* ... (keep existing sidebar code) ... */}
      </div>      

      <div className="main-content">
        <button className="back-home-button" onClick={() => navigate('/')}>
          Back Home
        </button>
        
        <div className="bible-verse-scroll">
          <p 
            ref={verseRef}
            className="scrolling-verse"
            onAnimationEnd={handleScrollEnd}
          >
            {bibleVerse || 'Loading verse...'}
          </p>
        </div>

        <h2 className="feed-title">Feed</h2>
        
        {/* ... (keep rest of the existing JSX) ... */}
      </div>
    </div>
  );
};

export default Feed;