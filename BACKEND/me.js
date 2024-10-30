// src/pages/Feed.js;
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Bell, MessageCircle, ThumbsUp } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import '../styles/Feed.css';

// Move utility functions outside component
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

// API service class instead of object
class ApiService {
  constructor(navigate) {
    this.navigate = navigate;
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

  async fetchFeeds() {
    try {
      const response = await axios.get('http://localhost:8000/api/feed');
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async getImageUrl(imagePath) {
    if (!imagePath) return '/default-profile.png';
    const cleanPath = imagePath.replace(/^uploads\//, '');
    return `http://localhost:8000/uploads/${cleanPath}`;
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

  async fetchBibleVerse() {
    try {
      const response = await axios.get('http://localhost:8000/api/bible-verse');
      return response.data.verse;
    } catch (error) {
      console.error('Error fetching Bible verse:', error);
      return 'Unable to load verse at this time.';
    }
  }

  async createPost(content) {
    try {
      const config = this.getHeaders();
      const response = await axios.post(
        `http://localhost:8000/api/feed`,
        { content },
        config
      );
      
      // Ensure we have the complete user details in the response
      const postWithUser = {
        ...response.data,
        user: {
          _id: response.data.user || response.data.user._id,
          name: response.data.user.name || '',
          username: response.data.user.username || ''
        }
      };

      return postWithUser;
    } catch (error) {
      this.handleApiError(error);
      throw new Error('Failed to create post');
    }
  }

  async updatePost(postId, content) {
    try {
      const response = await axios.put(
        `http://localhost:8000/api/feed/${postId}`,
        { content },
        this.getHeaders()
      );
  
      // Ensure we have the complete user details in the response
      const postWithUser = {
        ...response.data,
        user: {
          _id: response.data.user._id,
          name: response.data.user.name,
          username: response.data.user.username
        }
      };
  
      return postWithUser;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async deletePost(postId) {
    try {
      await axios.delete(
        `http://localhost:8000/api/feed/${postId}`,
        this.getHeaders()
      );
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async handleReaction(feedId, type, action) {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/feed/${feedId}/react`,
        { type, action },
        this.getHeaders()
      );
      return response.data;
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

const EditPostModal = ({ post, onClose, onUpdate }) => {
  const [content, setContent] = useState(post?.content || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="edit-textarea"
            placeholder="What's on your mind?"
          />
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="emoji-button"
          >
            😊
          </button>
          {showEmojiPicker && (
            <div className="emoji-picker-container">
              <Picker 
                data={data} 
                onEmojiSelect={(emoji) => {
                  setContent(prev => prev + emoji.native);
                  setShowEmojiPicker(false);
                }} 
              />
            </div>
          )}
          <div className="modal-buttons">
            <button 
              type="submit" 
              className="update-button"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="cancel-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Feed = () => {
  const { user } = useContext(AuthContext);
  const [feeds, setFeeds] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const timeUpdateInterval = useRef(null);
  const emojiPickerRef = useRef(null);
  const api = React.useMemo(() => new ApiService(navigate), [navigate]);


  // Handler functions
  const handleAuthorClick = async (e, username) => {
    e.preventDefault();
    e.stopPropagation();
  
    if (username) {
      try {
        const userProfile = await api.fetchUserProfile(username);
        const userId = userProfile._id; // assuming user profile contains `_id`
        navigate(`/profile/${userId}`);
      } catch (error) {
        console.error("Failed to navigate to user profile:", error);
      }
    }
  };  

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

        if (!user) {
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/login');
            return;
          }

          try {
            const res = await axios.get('http://localhost:8000/api/auth/user', {
              headers: { 'x-auth-token': token }
            });
            if (!res.data) {
              navigate('/login');
              return;
            }
          } catch (err) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
        }

        // Load all data in parallel
        const [feedsData, notificationsData, verseData, profileData] = await Promise.all([
          api.fetchFeeds(),
          api.fetchNotifications().catch(() => []),
          api.fetchBibleVerse().catch(() => ''),
          user ? api.fetchUserProfile(user.username).catch(() => null) : null
        ]);

        // Ensure each feed has complete user details
        const feedsWithUserDetails = await Promise.all(
          feedsData.map(async (feed) => {
            try {
              const userDetails = await api.fetchUserProfile(feed.user.username);
              return {
                ...feed,
                user: {
                  ...feed.user,
                  ...userDetails
                }
              };
            } catch (err) {
              return feed;
            }
          })
        );

        setFeeds(feedsWithUserDetails);
        setNotifications(notificationsData);
        setBibleVerse(verseData);
        setUserProfile(profileData);

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

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="feed-container">
      <div className="sidebar">
        <div className="user-profile">
          <img 
            src={api.getImageUrl(user.profileImage)}
            alt="User Profile"
            className="profile-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-profile.png';
            }}
          />
          <h3 className="user-name">{user.name || 'Guest'}</h3>
          <p className="user-info">@{user.username || 'guest'}</p>
        </div>
        <div className="notifications-pane">
          <h3 className="notifications-title">
            <Bell size={20} /> Notifications
            {notifications.length > 0 && (
              <span className="notification-count">{notifications.length}</span>
            )}
          </h3>
          {notifications.map((notification, index) => (
            <div 
              key={index} 
              className="notification-item"
              onClick={() => {
                if (notification.postId) {
                  navigate(`/feed/${notification.postId}`);
                }
              }}
            >
              <p className="notification-content">{notification.content}</p>
              <small className="notification-time">
                {formatTimeElapsed(notification.createdAt)}
              </small>
            </div>
          ))}
        </div>
      </div>

      <div className="main-content">
        <button className="back-home-button" onClick={() => navigate('/')}>
          Back Home
        </button>
        
        <div className="bible-verse-container">
          <div className="bible-verse-scroll">
            <span>{bibleVerse || 'Loading verse...'}</span>
          </div>
        </div>

        <h2 className="feed-title">Feed</h2>
        
        <form onSubmit={handlePostSubmit} className="post-form">
          <div className="new-post">
        <div className="emoji-button-container">
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="emoji-button"
          >
            😊
          </button>
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="emoji-picker-container">
              <Picker data={data} onEmojiSelect={onEmojiSelect} />
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

        {feeds.map((feed) => (
          feed && (
            <div key={feed._id} className="feed-item">
              <div className="feed-header">
                <div className="author-info">
                  <span 
                    className="author-name"
                    onClick={(e) => handleAuthorClick(e, feed.user.username)}
                    style={{ cursor: 'pointer', color: 'blue' }}
                  >
                    {feed.user.name || 'Unknown User'}
                  </span>
                  <span className="author-username">@{feed.user.username}</span>
                  <span className="feed-time">{formatTimeElapsed(feed.createdAt)}</span>
                </div>
                {user && user._id === feed.user._id && (
                  <div className="dropdown-wrapper">
                    <MoreVertical 
                      onClick={() => toggleDropdown(feed._id)}
                      className="dropdown-icon"
                    />
                    {activeDropdown === feed._id && (
                      <div className="dropdown-menu">
                        <button 
                          className="edit-button"
                          onClick={() => handleUpdate(feed._id, feed.content)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => handleDelete(feed._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
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



// src/pages/Profile.js;
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { MoreVertical } from 'lucide-react';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
  }, [username]);


  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/default-profile.png';
    const cleanPath = imagePath.replace(/^uploads\//, '');
    return `http://localhost:8000/uploads/${cleanPath}`;
  };

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/auth/profile/${username}`);
      setUser(res.data);
    } catch (err) {
      console.error(err);
      navigate('/feed');
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/feed/user/${username}`);
      setUserPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/feed/${postId}`);
  };

  const toggleDropdown = (postId) => {
    setActiveDropdown(activeDropdown === postId ? null : postId);
  };

  const handleDelete = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/feed/${postId}`, {
        headers: { 'x-auth-token': token }
      });
      setUserPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-container" style={styles.container}>
      <div className="profile-header" style={styles.header}>
        <img 
          src={getImageUrl(user.profileImage)}
            alt="User Profile"
            style={styles.profileImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-profile.png';
            }}
        />
        <h2 style={styles.name}>{user.name}</h2>
        <p style={styles.username}>@{user.username}</p>
        <p style={styles.email}>{user.email}</p>
        <p style={styles.role}>{user.role}</p>
        {user.contact && <p style={styles.contact}>{user.contact}</p>}
      </div>

      <div className="posts-section" style={styles.postsSection}>
        <h3 style={styles.sectionTitle}>Posts</h3>
        {userPosts.map(post => (
          <div key={post._id} style={styles.post}>
            <div style={styles.postHeader}>
              <span style={styles.postDate}>
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
              {currentUser && (currentUser._id === user._id || currentUser.role === 'admin') && (
                <div style={styles.postActions}>
                  <button onClick={() => toggleDropdown(post._id)} style={styles.actionButton}>
                    <MoreVertical size={20} />
                  </button>
                  {activeDropdown === post._id && (
                    <div style={styles.dropdown}>
                      <button 
                        onClick={() => navigate(`/feed/${post._id}/edit`)}
                        style={styles.dropdownButton}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(post._id)}
                        style={styles.dropdownButton}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div 
              onClick={() => handlePostClick(post._id)}
              style={styles.postContent}
            >
              <p>{post.content}</p>
              {post.attachments && post.attachments.length > 0 && (
                <div style={styles.attachments}>
                  {post.attachments.map((attachment, index) => (
                    <img 
                      key={index} 
                      src={attachment} 
                      alt="Attachment"
                      style={styles.attachmentImage}
                    />
                  ))}
                </div>
              )}
              <div style={styles.postStats}>
                <span>👍 {post.reactions.length}</span>
                <span>💬 {post.comments.length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  profileImage: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '20px',
    border: '3px solid #cbbad4',
  },
  name: {
    color: '#a1626a',
    marginBottom: '5px',
  },
  username: {
    color: '#666',
    marginBottom: '10px',
  },
  email: {
    color: '#666',
    marginBottom: '5px',
  },
  role: {
    color: '#a1626a',
    textTransform: 'capitalize',
    marginBottom: '5px',
  },
  contact: {
    color: '#666',
  },
  postsSection: {
    marginTop: '20px',
  },
  sectionTitle: {
    color: '#a1626a',
    marginBottom: '20px',
  },
  post: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  postDate: {
    color: '#666',
    fontSize: '0.9em',
  },
  postActions: {
    position: 'relative',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '100%',
    backgroundColor: '#fff',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 1000,
  },
  dropdownButton: {
    display: 'block',
    width: '100%',
    padding: '10px 20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: '#333',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  postContent: {
    cursor: 'pointer',
  },
  attachments: {
    marginTop: '10px',
  },
  attachmentImage: {
    maxWidth: '100%',
    borderRadius: '5px',
    marginBottom: '10px',
  },
  postStats: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px',
    color: '#666',
  },
};

export default Profile;



// BACKEND/routes/feedRoutes.js;
// Create a feed post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const newFeed = new Feed({
      user: req.user.id,
      content,
      attachments
    });
    
    // Save the feed post
    const feed = await newFeed.save();
    
    // Populate the user details before sending the response
    const populatedFeed = await Feed.findById(feed._id)
      .populate('user', 'name username _id')
      .exec();

    res.json(populatedFeed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all feed posts
router.get('/', async (req, res) => {
  try {
    const feeds = await Feed.find().sort({ createdAt: -1 }).populate('user', 'name');
    res.json(feeds);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get a single feed post
router.get('/:id', async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id)
      .populate('user', 'name')
      .populate('comments.user', 'name');
    
    if (!feed) {
      return res.status(404).json({ msg: 'Feed post not found' });
    }
    
    res.json(feed);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Feed post not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Update a feed post
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const feed = await Feed.findById(req.params.id);

    if (!feed) {
      return res.status(404).json({ msg: 'Feed post not found' });
    }

    // Check user authorization
    if (feed.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Update the feed post
    feed.content = content;
    feed.attachments = attachments;
    await feed.save();

    // Populate the user details before sending the response
    const updatedFeed = await Feed.findById(feed._id)
      .populate('user', 'name username _id')
      .exec();

    res.json(updatedFeed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;


// BACKEND/routes/authRoutes.js

router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email -contact');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    console.log(err, 'error from profile');
    res.status(500).send('Server Error');
  }
});

module.exports = router;