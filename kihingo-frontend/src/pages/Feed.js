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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl transform transition-all duration-300 ease-in-out scale-95 hover:scale-100 shadow-2xl" 
           onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 border rounded-xl mb-4 min-h-[150px] resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="What's on your mind?"
          />
          <div className="flex justify-between items-center">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-2xl hover:scale-110 transition-transform duration-200 p-2 rounded-full hover:bg-purple-50"
            >
              😊
            </button>
            <div className="space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full font-medium transform hover:scale-105 transition-all duration-300 disabled:opacity-50 hover:shadow-lg"
              >
                Update
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full font-medium transform hover:scale-105 transition-all duration-300 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
          {showEmojiPicker && (
            <div className="absolute mt-2" ref={emojiPickerRef}>
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

  // UI Component - Loading Spinner
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-ping"></div>
        <div className="absolute inset-0 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    </div>
  );

  // Error Message Component
  const ErrorMessage = ({ message }) => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-red-50 text-red-600 px-6 py-4 rounded-lg shadow-lg">
        {message}
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Fixed Sidebar */}
      <div className="w-80 bg-white/80 backdrop-blur-lg p-6 shadow-2xl fixed h-full transform transition-all duration-300 hover:shadow-purple-200/50 border-r border-purple-100/50 overflow-y-auto">
        <div className="text-center mb-8 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative">
            <img
              src={userProfileImage}
              alt="User Profile"
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg transform group-hover:scale-105 transition-all duration-300 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-profile.png';
              }}
            />
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              {user.name || 'Guest'}
            </h3>
            <p className="text-purple-600">@{user.username || 'guest'}</p>
          </div>
      </div>
  
        <div className="mb-8 bg-white/90 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="overflow-hidden">
            <p
              ref={verseRef}
              className="text-purple-700 italic text-sm animate-scroll"
              onAnimationEnd={handleScrollEnd}
            >
              {bibleVerse || 'Loading verse...'}
            </p>
          </div>
        </div>

        {/* Enhanced Notifications Section */}
            <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
              <h4 className="font-semibold text-purple-800 flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5" />
                Notifications
              </h4>
              {notifications.map((notification, index) => (
                <div
                  key={notification._id || index}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-purple-100/50 transform hover:-translate-y-1 hover:scale-[1.02]"
                >
                  <p className="text-sm text-gray-600">{notification.content}</p>
                  <span className="text-xs text-purple-500">{formatTimeElapsed(notification.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 ml-80 p-6 space-y-6">
            {/* Home Button */}
            <button 
              onClick={() => navigate('/')}
              className="mb-6 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 text-purple-600 font-medium transform hover:-translate-y-1"
            >
              Back Home
            </button>
  
        <h2 className="feed-title">Church Feed</h2>
  
        {/* Post Creation Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl border border-purple-100/50">
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <div className="flex gap-4 items-start">
              <img
                src={userProfileImage}
                alt="Your Profile"
                className="w-12 h-12 rounded-full border-2 border-purple-200"
              />
              <div className="flex-1 space-y-4">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full resize-none rounded-xl border-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px] transition-all duration-300 p-4"
                />
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-2xl hover:scale-110 transition-transform duration-200 p-2 rounded-full hover:bg-purple-50"
                  >
                    😊
                  </button>
                  <button
                    type="submit"
                    disabled={!newPostContent.trim() || isSubmitting}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full font-medium transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                  >
                    Post
                  </button>
                </div>
                {showEmojiPicker && (
                  <div className="absolute mt-2" ref={emojiPickerRef}>
                    <Picker data={data} onEmojiSelect={onEmojiSelect} />
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Feed Items */}
        <div className="space-y-6">
          {feeds.map((feed) => (
            <div
              key={feed._id}
              className="bg-white rounded-2xl shadow-lg p-6 space-y-4 transform transition-all duration-300 hover:shadow-2xl border border-purple-100/50 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <img
                  src={feed.user.profileImage || '/default-profile.png'}
                  alt={feed.user.name}
                  className="w-12 h-12 rounded-full border-2 border-purple-200 cursor-pointer transform hover:scale-105 transition-all duration-300"
                  onClick={(e) => handleAuthorClick(e, feed.user.username)}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span 
                        className="font-semibold text-gray-900 hover:text-purple-600 cursor-pointer"
                        onClick={(e) => handleAuthorClick(e, feed.user.username)}
                      >
                        {feed.user.name}
                      </span>
                      <span className="text-gray-500 ml-2">@{feed.user.username}</span>
                      <span className="text-gray-400 text-sm ml-2">· {formatTimeElapsed(feed.createdAt)}</span>
                    </div>
                    {user && (user._id === feed.user._id || user.role === 'admin') && (
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(feed._id)}
                          className="p-2 hover:bg-purple-50 rounded-full transition-colors duration-200"
                        >
                          <MoreVertical size={20} className="text-gray-500" />
                        </button>
                        {activeDropdown === feed._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-10 border border-purple-100/50 transform transition-all duration-200 animate-fadeIn">
                            <button
                              onClick={() => setEditingPost(feed)}
                              className="w-full px-4 py-2 text-left hover:bg-purple-50 flex items-center gap-2"
                            >
                              <Edit size={16} className="text-purple-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(feed._id)}
                              className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash size={16} className="text-red-600" />
                              <span className="text-red-600">Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-gray-800 whitespace-pre-wrap">{feed.content}</p>
                  <div className="flex gap-6 mt-4">
                    <button
                      onClick={() => handleReaction(feed._id)}
                      className="group flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors duration-200">
                      <div className="relative">
                        <ThumbsUp
                          size={20}
                          className={`transform transition-all duration-300 group-hover:scale-125 ${
                            feed.reactions?.some(r => r.user === user?._id)
                              ? 'text-purple-600 scale-110'
                              : ''
                          }`}
                        />
                        <div className="absolute inset-0 bg-purple-400 rounded-full transform scale-110 opacity-0 group-hover:animate-ping" />
                      </div>
                      <span className="group-hover:font-medium">
                        {feed.reactions?.length || 0}
                      </span>
                    </button>
                    <button
                      onClick={() => handlePostClick(feed._id)}
                      className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
                    >
                      <MessageCircle
                        size={20}
                        className="transform transition-all duration-300 group-hover:scale-125"
                      />
                      <span className="group-hover:font-medium">
                        {feed.comments?.length || 0}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Post Modal */}
        {editingPost && (
          <EditPostModal
            post={editingPost}
            onClose={() => setEditingPost(null)}
            onUpdate={handleUpdate}
          />
        )}
      </div>

      {/* Responsive Menu Button - Only visible on mobile */}
      <button
        className="fixed bottom-4 right-4 md:hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        onClick={() => document.querySelector('.sidebar').classList.toggle('translate-x-0')}
      >
        <Bell size={24} />
      </button>
    </div>
  );
};

// CSS animations to be added to your CSS file or styled-components
const styles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scrollVerse {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-in-out;
}

.scrolling-verse {
  animation: scrollVerse 15s linear;
  white-space: nowrap;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(139, 92, 246, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(139, 92, 246, 0.5);
}
`;

export default Feed;