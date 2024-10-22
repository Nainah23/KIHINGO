// src/pages/Feed.js;
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Bell } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const formatTimeElapsed = (date) => {
  const now = new Date();
  const posted = new Date(date);
  const diffInMinutes = Math.floor((now - posted) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return posted.toLocaleDateString();
};

const EditPostModal = ({ post, onClose, onUpdate }) => {
  const [content, setContent] = useState(post.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(post._id, content);
    onClose();
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.editTextarea}
          />
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={styles.emojiButton}
          >
            😊
          </button>
          {showEmojiPicker && (
            <div style={styles.emojiPickerContainer}>
              <Picker 
                data={data} 
                onEmojiSelect={(emoji) => {
                  setContent(prev => prev + emoji.native);
                  setShowEmojiPicker(false);
                }} 
              />
            </div>
          )}
          <div style={styles.modalButtons}>
            <button type="submit" style={styles.updateButton}>Update</button>
            <button type="button" onClick={onClose} style={styles.cancelButton}>Cancel</button>
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
  const navigate = useNavigate();

  const onEmojiSelect = (emoji) => {
    setNewPostContent(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    fetchFeeds();
    fetchNotifications();
    fetchBibleVerse();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/auth/profile/${user.username}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setUserProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeeds = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/feed');
      setFeeds(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/notifications',
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBibleVerse = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/bible-verse');
      setBibleVerse(res.data.verse);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReaction = async (feedId) => {
    if (!user) {
      alert('Please login to react.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const existingReaction = feeds.find(f => f._id === feedId)?.reactions
        .find(r => r.user === user._id);

      const res = await axios.post(
        `http://localhost:8000/api/feed/${feedId}/react`,
        { 
          type: '👍',
          action: existingReaction ? 'remove' : 'add'
        },
        { headers: { 'x-auth-token': token } }
      );

      setFeeds(prevFeeds =>
        prevFeeds.map(feed =>
          feed._id === feedId ? { ...feed, reactions: res.data.reactions } : feed
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to create a post.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:8000/api/feed',
        { content: newPostContent },
        { headers: { 'x-auth-token': token } }
      );
      setNewPostContent('');
      setFeeds(prevFeeds => [res.data, ...prevFeeds]);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostClick = (feedId) => {
    navigate(`/feed/${feedId}`);
  };

  const handleAuthorClick = (e, username) => {
    e.stopPropagation(); // Prevent post click event from firing
    navigate(`/profile/${username}`);
  };

  const handleDelete = async (feedId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/feed/${feedId}`, {
        headers: { 'x-auth-token': token }
      });
      setFeeds(prevFeeds => prevFeeds.filter(feed => feed._id !== feedId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (feedId, newContent) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:8000/api/feed/${feedId}`,
        { content: newContent },
        { headers: { 'x-auth-token': token } }
      );
      setFeeds(prevFeeds =>
        prevFeeds.map(feed =>
          feed._id === feedId ? res.data : feed
        )
      );
      setEditingPost(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDropdown = (feedId) => {
    setActiveDropdown(activeDropdown === feedId ? null : feedId);
  };

  return (
    <div style={styles.feedContainer}>
      <div style={styles.sidebar}>
        <div style={styles.userProfile}>
          <img 
            src={userProfile?.profileImage || '/CHURCH.jpg'} 
            alt="Profile" 
            style={styles.profileImage} 
          />
          <h3 style={styles.userName}>{userProfile?.name}</h3>
          <p style={styles.userInfo}>@{userProfile?.username}</p>
        </div>
        <div style={styles.notificationsPane}>
          <h3 style={styles.notificationsTitle}>
            <Bell size={20} /> Notifications
            {notifications.length > 0 && (
              <span style={styles.notificationCount}>{notifications.length}</span>
            )}
          </h3>
          {notifications.map((notification, index) => (
            <div 
              key={index} 
              style={styles.notificationItem}
              onClick={() => {
                if (notification.postId) {
                  navigate(`/feed/${notification.postId}`);
                }
              }}
            >
              <p style={styles.notificationContent}>{notification.content}</p>
              <small style={styles.notificationTime}>
                {formatTimeElapsed(notification.createdAt)}
              </small>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.mainContent}>
        <button style={styles.backHomeButton} onClick={() => navigate('/')}>
          Back Home
        </button>
        
        <div style={styles.bibleVerseContainer}>
          <div style={styles.bibleVerseScroll}>
            <span>{bibleVerse}</span>
          </div>
        </div>

        <h2 style={styles.feedTitle}>Feed</h2>
        
        <form onSubmit={handlePostSubmit} style={styles.postForm}>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's on your mind?"
            style={styles.postTextarea}
          />
          <div style={styles.postFormActions}>
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={styles.emojiButton}
            >
              😊
            </button>
            {showEmojiPicker && (
              <div style={styles.emojiPickerContainer}>
                <Picker data={data} onEmojiSelect={onEmojiSelect} />
              </div>
            )}
            <button type="submit" style={styles.postSubmitButton}>Post</button>
          </div>
        </form>

        {feeds.map((feed) => (
          <div key={feed._id} style={styles.feedItem}>
            <div style={styles.feedHeader}>
              
              <div>
                <h3 
                  style={styles.authorName}
                  onClick={(e) => handleAuthorClick(e, feed.author.username)}
                >
                  {feed.author.name}
                </h3>
                <p style={styles.feedTime}>{formatTimeElapsed(feed.createdAt)}</p>
              </div>
              {user && user._id === feed.author._id && (
                <div style={styles.dropdownWrapper}>
                  <MoreVertical 
                    onClick={() => toggleDropdown(feed._id)}
                    style={styles.dropdownIcon}
                  />
                  {activeDropdown === feed._id && (
                    <div style={styles.dropdownMenu}>
                      <button 
                        style={styles.editButton}
                        onClick={() => setEditingPost(feed)}
                      >
                        Edit
                      </button>
                      <button 
                        style={styles.deleteButton}
                        onClick={() => handleDelete(feed._id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p onClick={() => handlePostClick(feed._id)} style={styles.feedContent}>
              {feed.content}
            </p>
            <div style={styles.feedReactions}>
              <button onClick={() => handleReaction(feed._id)} style={styles.reactionButton}>
                👍 {feed.reactions.length}
              </button>
            </div>
          </div>
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

const styles = {
  feedContainer: {
    display: 'flex',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  sidebar: {
    width: '300px',
    backgroundColor: '#cbbad4',
    padding: '20px',
    boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
  },
  userProfile: {
    marginBottom: '30px',
    textAlign: 'center',
  },
  profileImage: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '10px',
  },
  userName: {
    color: '#a1626a',
    marginBottom: '5px',
  },
  userInfo: {
    color: '#333',
    marginBottom: '5px',
  },
  notificationsPane: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  notificationsTitle: {
    color: '#a1626a',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
  },
  notificationCount: {
    backgroundColor: '#a1626a',
    color: 'white',
    borderRadius: '50%',
    padding: '2px 6px',
    fontSize: '0.8em',
    marginLeft: '5px',
  },
  notificationItem: {
    borderBottom: '1px solid #eee',
    padding: '10px 0',
    cursor: 'pointer',
  },
  notificationContent: {
    margin: '0 0 5px 0',
  },
  notificationTime: {
    color: '#666',
  },
  mainContent: {
    flex: 1,
    padding: '20px',
  },
  backHomeButton: {
    backgroundColor: '#a1626a',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  bibleVerseContainer: {
    backgroundColor: '#cbbad4',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  bibleVerseScroll: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  feedTitle: {
    color: '#a1626a',
    marginBottom: '20px',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  postForm: {
    display: 'flex',
    marginBottom: '20px',
  },
  postInput: {
    flex: 1,
    padding: '10px',
    borderRadius: '5px 0 0 5px',
    border: '1px solid #ccc',
  },
  emojiButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.5em',
    padding: '0 10px',
  },
  emojiPickerContainer: {
    position: 'absolute',
    zIndex: 1000,
    top: '100%',
    left: 0,
  },
  postButton: {
    backgroundColor: '#a1626a',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '0 5px 5px 0',
    cursor: 'pointer',
  },
  loginPrompt: {
    color: '#666',
    fontStyle: 'italic',
  },
  feedPost: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  postUserName: {
    fontWeight: 'bold',
    color: '#a1626a',
  },
  postActions: {
    position: 'relative',
  },
  threeDotsButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  postActionsDropdown: {
    position: 'absolute',
    right: 0,
    top: '100%',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    borderRadius: '5px',
    zIndex: 1,
  },
  dropdownButton: {
    display: 'block',
    width: '100%',
    padding: '10px',
    textAlign: 'left',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  postContent: {
    marginBottom: '15px',
    cursor: 'pointer',
  },
  content: {
    margin: 0,
    wordBreak: 'break-word',
  },
  editTextarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginBottom: '10px',
    minHeight: '100px',
    resize: 'vertical',
  },
  updateButton: {
    backgroundColor: '#a1626a',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    color: 'black',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  attachments: {
    marginTop: '10px',
    display: 'grid',
    gridGap: '10px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  },
  attachmentImage: {
    maxWidth: '100%',
    borderRadius: '5px',
    objectFit: 'cover',
  },
  reactionSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #eee',
  },
  reactionButtons: {
    display: 'flex',
    gap: '10px',
  },
  reactionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 10px',
    borderRadius: '5px',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  replyButton: {
    backgroundColor: '#cbbad4',
    color: '#a1626a',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '5px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#bca9c3',
    },
  },
  authorImage: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    marginRight: '10px',
    cursor: 'pointer',
  },
  authorName: {
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
};

export default Feed;