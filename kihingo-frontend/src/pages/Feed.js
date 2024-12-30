// kihingo-frontend/src/pages/Feed.js;
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import NotificationsPane from '../components/NotificationsPane';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Bell, MessageCircle, ThumbsUp, Edit, Trash } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// Utility functions
const formatTimeElapsed = (date) => {
  if (!date) return '';
  const now = new Date();
  const posted = new Date(date);
  const diffInMinutes = Math.floor((now - posted) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  
  return posted.toLocaleDateString();
};

// API service class
class ApiService {
  constructor(navigate) {
    this.navigate = navigate;
    this.baseUrl = 'http://localhost:8000';
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.navigate('/login');
      throw new Error('No authentication token found');
    }
    return {
      headers: { 
        'x-auth-token': token,
        'Content-Type': 'application/json'
      }
    };
  }

  async getImageUrl(imagePath) {
    if (!imagePath) return '/default-profile.png';
    const cleanPath = imagePath.replace(/^uploads\//, '');
    return `${this.baseUrl}/uploads/${cleanPath}`;
  }

  async fetchFeeds() {
    try {
      const { data: feeds } = await axios.get(`${this.baseUrl}/api/feed`, this.getHeaders());
      
      // Fetch complete user details for each feed
      const feedsWithUserDetails = await Promise.all(
        feeds.map(async (feed) => {
          try {
            if (!feed.user?.username) {
              console.warn(`No username found for feed ${feed._id}`);
              return feed;
            }

            const { data: userDetails } = await axios.get(
              `${this.baseUrl}/api/auth/profile/${feed.user.username}`,
              this.getHeaders()
            );
            
            return {
              ...feed,
              user: {
                ...feed.user,
                ...userDetails,
                profileImage: await this.getImageUrl(userDetails.profileImage)
              }
            };
          } catch (err) {
            console.error(`Error fetching user details for feed ${feed._id}:`, err);
            return feed;
          }
        })
      );
      
      return feedsWithUserDetails;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async fetchUserProfile(username) {
    if (!username) {
      throw new Error('Username is required');
    }
    
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { 'x-auth-token': token } } : {};
      const response = await axios.get(
        `http://localhost:8000/api/auth/profile/${username}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw new Error('Failed to fetch user profile');
    }
  }

  async fetchNotifications() {
    try {
      const response = await axios.get(
        'http://localhost:8000/api/notifications',
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async createPost(content) {
    try {
      const { data: newPost } = await axios.post(
        `${this.baseUrl}/api/feed`,
        { content },
        this.getHeaders()
      );
      
      // Fetch complete user details for the new post
      const { data: userDetails } = await axios.get(
        `${this.baseUrl}/api/auth/profile/${newPost.user.username}`,
        this.getHeaders()
      );
      
      return {
        ...newPost,
        user: {
          ...newPost.user,
          ...userDetails,
          profileImage: await this.getImageUrl(userDetails.profileImage)
        }
      };
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async updatePost(postId, content) {
    try {
      const { data: updatedPost } = await axios.put(
        `${this.baseUrl}/api/feed/${postId}`,
        { content },
        this.getHeaders()
      );
      
      // Fetch complete user details for the updated post
      const { data: userDetails } = await axios.get(
        `${this.baseUrl}/api/auth/profile/${updatedPost.user.username}`,
        this.getHeaders()
      );
      
      return {
        ...updatedPost,
        user: {
          ...updatedPost.user,
          ...userDetails,
          profileImage: await this.getImageUrl(userDetails.profileImage)
        }
      };
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async deletePost(postId) {
    try {
      await axios.delete(
        `${this.baseUrl}/api/feed/${postId}`,
        this.getHeaders()
      );
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async handleReaction(feedId, type, action) {
    try {
      const { data } = await axios.post(
        `${this.baseUrl}/api/feed/${feedId}/react`,
        { type, action },
        this.getHeaders()
      );
      return data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  handleApiError(error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      this.navigate('/login');
    }
    console.error('API Error:', error);
  }
}

// EditPostModal Component
const EditPostModal = ({ post, onClose, onUpdate }) => {
  const [content, setContent] = useState(post?.content || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!post?._id || !content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onUpdate(post._id, content);
      onClose();
    } catch (error) {
      console.error('Failed to update post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl transform transition-all duration-300 ease-in-out" 
           onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 border rounded-lg mb-4 min-h-[150px] resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="What's on your mind?"
          />
          <div className="flex justify-between items-center">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-2xl hover:scale-110 transition-transform duration-200"
            >
              😊
            </button>
            <div className="space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
              >
                Update
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transform hover:scale-105 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
          {showEmojiPicker && (
            <div className="absolute mt-2">
              <Picker 
                data={data} 
                onEmojiSelect={(emoji) => {
                  setContent(prev => prev + emoji.native);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
};


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

  const handleAuthorClick = (e, username) => {
    e.preventDefault();
    e.stopPropagation();
    if (username) {
      navigate(`/profile/${username}`);
    } else {
      console.warn('No username provided for profile navigation');
    }
  };

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

  const fetchBibleVerse = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/bible-verse');
      if (!res.ok) throw new Error('Failed to fetch Bible verse');
      const data = await res.json();
      // Only update verse if not currently scrolling
      if (!isScrolling) {
        setBibleVerse(data.verse);
        scrollCount.current = 0;
        startScrollAnimation();
      }
    } catch (error) {
      console.error('Error fetching Bible verse:', error);
    }
  }, [isScrolling]);

  const handlePostClick = (postId) => {
    navigate(`/feed/${postId}`);
  };

  const toggleDropdown = (feedId) => {
    setActiveDropdown(prev => prev === feedId ? null : feedId);
  };

  const onEmojiSelect = (emoji) => {
    setNewPostContent(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        const [feedsData, notificationsData] = await Promise.all([
          api.fetchFeeds(),
          api.fetchNotifications().catch(() => []),
        ]);

        setFeeds(feedsData);
        setNotifications(notificationsData);

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

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newPostContent.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newPost = await api.createPost(newPostContent);
      const completePost = {
        ...newPost,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          ...newPost.user // Merge any additional user details from the response
        },
        reactions: [],
        comments: [],
        createdAt: new Date().toISOString()
      };

      // Update the feeds state with the complete post
      setFeeds(prevFeeds => [completePost, ...prevFeeds]);
      setNewPostContent('');
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error('Error creating post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (feedId, newContent) => {
    if (!newContent.trim()) return;

    try {
      const updatedPost = await api.updatePost(feedId, newContent);
      setFeeds(prevFeeds =>
        prevFeeds.map(feed =>
          feed._id === feedId ? updatedPost : feed
        )
      );
      setEditingPost(null);
    } catch (err) {
      setError('Failed to update post. Please try again.');
      console.error('Error updating post:', err);
    }
  };

  const handleDelete = async (feedId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.deletePost(feedId);
      setFeeds(prevFeeds => prevFeeds.filter(feed => feed._id !== feedId));
    } catch (err) {
      setError('Failed to delete post. Please try again.');
      console.error('Error deleting post:', err);
    }
  };

  const handleReaction = async (feedId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const feed = feeds.find(f => f._id === feedId);
      if (!feed) return;

      const existingReaction = feed.reactions?.find(r => r.user === user._id);
      const { reactions } = await api.handleReaction(
        feedId, 
        '👍', 
        existingReaction ? 'remove' : 'add'
      );

      setFeeds(prevFeeds =>
        prevFeeds.map(feed =>
          feed._id === feedId ? { ...feed, reactions } : feed
        )
      );
    } catch (err) {
      console.error('Error handling reaction:', err);
      setError('Failed to update reaction. Please try again.');
    }
  };

  const renderDropdownMenu = (feed) => {
    if (activeDropdown === feed._id) {
      return (
        <div className="dropdown">
          <button 
            onClick={() => setEditingPost(feed)}
            className="dropdown-button"
          >
            <Edit size={16} className="dropdown-icon" />
            Edit
          </button>
          <button 
            onClick={() => handleDelete(feed._id)}
            className="dropdown-button"
          >
            <Trash size={16} className="dropdown-icon" />
            Delete
          </button>
        </div>
      );
    }
    return null;
  };

  // Updated post form with emoji picker matching SinglePost.js
  const renderPostForm = () => (
    <form onSubmit={handlePostSubmit} className="post-form">
      <div className="new-post">
        <div className="emoji-input-container">
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="emoji-button"
          >
            😊
          </button>
          {showEmojiPicker && (
            <div className="emoji-picker-container" ref={emojiPickerRef}>
              <Picker 
                data={data} 
                onEmojiSelect={(emoji) => {
                  setNewPostContent(prev => prev + emoji.native);
                  setShowEmojiPicker(false);
                }} 
              />
            </div>
          )}
        </div>
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="What's on your mind?"
          className="post-textarea"
        />
      </div>
      <button 
        type="submit" 
        className="post-submit-button"
        disabled={!newPostContent.trim()}
      >
        Post
      </button>
    </form>
  );

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-purple-100 p-6 shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <div className="text-center mb-8">
          <img
            src={userProfileImage}
            alt="User Profile"
            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg transform hover:scale-105 transition-all duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-profile.png';
            }}
          />
          <h3 className="text-xl font-bold text-purple-800">{user.name || 'Guest'}</h3>
          <p className="text-purple-600">@{user.username || 'guest'}</p>
        </div>

        <NotificationsPane 
          notifications={notifications}
          formatTimeElapsed={formatTimeElapsed}
        />
      </div>
  
      <div className="main-content">
        <button className="back-home-button" onClick={() => navigate('/')}>
          Back Home
        </button>
  
        <div className="bible-verse-container">
          <div className="bible-verse-scroll">
            <p
              ref={verseRef}
              className="scrolling-verse"
              onAnimationEnd={handleScrollEnd}
            >
              {bibleVerse || 'Loading verse...'}
            </p>
          </div>
        </div>
  
        <h2 className="feed-title">Church Feed</h2>
  
        {renderPostForm()}
  
        {feeds.map((feed) => (
          feed && (
            <div key={feed._id} className="feed-item">
              <div className="feed-header">
                <div className="author-info">
                  <span className="author-name">{feed.user.name}</span>
                  <span
                    className="author-username"
                    onClick={(e) => handleAuthorClick(e, feed.user.username)}
                    style={{ cursor: 'pointer' }}
                  >
                    @{feed.user.username}
                  </span>
                  <span className="feed-time">{formatTimeElapsed(feed.createdAt)}</span>
                </div>
                {user && (user._id === feed.user._id || user.role === 'admin') && (
                  <div className="post-actions">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === feed._id ? null : feed._id)}
                      className="action-button"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {renderDropdownMenu(feed)}
                  </div>
                )}
              </div>
              <p onClick={() => handlePostClick(feed._id)} className="feed-content">
                {feed.content}
              </p>
              <div className="reactions">
                <button
                  onClick={() => handleReaction(feed._id)}
                  className="reaction-button"
                >
                  <ThumbsUp size={18} /> {feed.reactions?.length || 0}
                </button>
                <button
                  onClick={() => handlePostClick(feed._id)}
                  className="comment-button"
                >
                  <MessageCircle size={18} /> {feed.comments?.length || 0}
                </button>
              </div>
            </div>
          )
        ))}
  
        {editingPost && (
          <EditPostModal
            post={editingPost}
            onClose={() => setEditingPost(null)}
            onUpdate={handleUpdate}
          />
        )}
      </div>
      </div>
    );
  };
  
  export default Feed;