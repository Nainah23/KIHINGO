// src/pages/SinglePost.js;
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Edit, Trash, MoreVertical } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const SinglePost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedComment, setEditedComment] = useState('');

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/feed/${id}`);
      setPost(res.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        alert('Post not found');
        navigate('/feed');
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to comment.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:8000/api/feed/${id}/comment`,
        { content: comment },
        { headers: { 'x-auth-token': token } }
      );

      // Update the post state with the new comment
      setPost(prevPost => ({
        ...prevPost,
        comments: [
          ...prevPost.comments,
          {
            _id: res.data._id,
            content: comment,
            user: {
              _id: user._id,
              name: user.name,
              username: user.username
            },
            createdAt: new Date().toISOString()
          }
        ]
      }));

      setComment('');
      setShowEmojiPicker(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReaction = async () => {
    if (!user) {
      alert('Please login to react.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const existingReaction = post.reactions.find(r => r.user === user._id);

      const res = await axios.post(
        `http://localhost:8000/api/feed/${id}/react`,
        { 
          type: '👍',
          action: existingReaction ? 'remove' : 'add'
        },
        { headers: { 'x-auth-token': token } }
      );

      setPost(prevPost => ({
        ...prevPost,
        reactions: res.data.reactions
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:8000/api/feed/${id}/comment/${commentId}`,
        { headers: { 'x-auth-token': token } }
      );

      setPost(prevPost => ({
        ...prevPost,
        comments: prevPost.comments.filter(comment => comment._id !== commentId)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/feed/${postId}`, {
        headers: { 'x-auth-token': token }
      });
      navigate('/feed');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostEdit = async (postId) => {


  const handleCommentEdit = async (commentId, newContent) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:8000/api/feed/${id}/comment/${commentId}`,
        { content: newContent },
        { headers: { 'x-auth-token': token } }
      );

      setPost(prevPost => ({
        ...prevPost,
        comments: prevPost.comments.map(comment =>
          comment._id === commentId
            ? { ...comment, content: newContent }
            : comment
        )
      }));

      setEditingCommentId(null);
      setEditedComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const onEmojiSelect = (emoji) => {
    setComment(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  if (!post) return <div>Loading...</div>;

  return (
    <div className="single-post-container" style={styles.container}>
      <button className="back-button" onClick={() => navigate('/feed')} style={styles.backButton}>
        Back to Feed
      </button>

      <div className="post-content" style={styles.postContent}>
        <div style={styles.postHeader}>
          <div style={styles.userInfo}>
            <span 
              onClick={() => handleUserClick(post.user.username)}
              style={styles.userName}
            >
              {post.user.name}
            </span>
            <span style={styles.postTime}>
              {new Date(post.createdAt).toLocaleString()}
            </span>
          </div>
          {user && (user._id === post.user._id || user.role === 'admin') && (
            <div className="post-actions" style={styles.postActions}>
              <button 
                onClick={() => setActiveDropdown(activeDropdown ? null : 'post')}
                style={styles.actionButton}
              >
                <MoreVertical size={20} />
              </button>
              {activeDropdown === 'post' && (
                <div style={styles.dropdown}>
                  <button 
                    onClick={() => navigate(`/feed/${post._id}/edit`)}
                    style={styles.dropdownButton}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => {
                      handleDelete(post._id);
                      navigate('/feed');
                    }}
                    style={styles.dropdownButton}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p style={styles.postBody}>{post.content}</p>

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

        <div style={styles.reactionSection}>
          <button 
            onClick={handleReaction}
            style={styles.reactionButton}
          >
            👍 {post.reactions.length}
          </button>
        </div>

        {/* Comment Form */}
        {user && (
          <form onSubmit={handleCommentSubmit} style={styles.commentForm}>
            <div style={styles.commentInputContainer}>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                style={styles.commentInput}
              />
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={styles.emojiButton}
              >
                😊
              </button>
            </div>
            {showEmojiPicker && (
              <div style={styles.emojiPickerContainer}>
                <Picker data={data} onEmojiSelect={onEmojiSelect} />
              </div>
            )}
            <button type="submit" style={styles.submitButton}>
              Comment
            </button>
          </form>
        )}

        {/* Comments Section */}
        <div style={styles.commentsSection}>
          <h3>Comments</h3>
          {post.comments.map((comment) => (
            <div key={comment._id} style={styles.comment}>
              <div style={styles.commentHeader}>
                <span 
                  onClick={() => handleUserClick(comment.user.username)}
                  style={styles.commentUserName}
                >
                  {comment.user.name}
                </span>
                {user && (user._id === comment.user._id || user.role === 'admin') && (
                  <div style={styles.commentActions}>
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === comment._id ? null : comment._id)}
                      style={styles.actionButton}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeDropdown === comment._id && (
                      <div style={styles.dropdown}>
                        <button 
                          onClick={() => {
                            setEditingCommentId(comment._id);
                            setEditedComment(comment.content);
                          }}
                          style={styles.dropdownButton}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleCommentDelete(comment._id)}
                          style={styles.dropdownButton}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {editingCommentId === comment._id ? (
                <div style={styles.editCommentForm}>
                  <input
                    type="text"
                    value={editedComment}
                    onChange={(e) => setEditedComment(e.target.value)}
                    style={styles.editCommentInput}
                  />
                  <div style={styles.editCommentButtons}>
                    <button 
                      onClick={() => handleCommentEdit(comment._id, editedComment)}
                      style={styles.editButton}
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditedComment('');
                      }}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p style={styles.commentContent}>{comment.content}</p>
              )}
              <span style={styles.commentTime}>
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SinglePost;

// src/pages/Feed.js;
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Bell } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const Feed = () => {
  const { user } = useContext(AuthContext);
  const [feeds, setFeeds] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');
  //const [lastVerseChange, setLastVerseChange] = useState(Date.now());
  //const [activeDropdown, setActiveDropdown] = useState(null);
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
      const res = await axios.get(`http://localhost:8000/api/profile/${user.username}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setUserProfile(res.data);
      console.log(res.data); // Log the response
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
      {/* Left Sidebar - User Profile & Notifications */}
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
                {new Date(notification.createdAt).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <button style={styles.backHomeButton} onClick={() => navigate('/')}>
          Back Home
        </button>
        
        <div style={styles.bibleVerseContainer}>
          <div style={styles.bibleVerseScroll}>
            <span>{bibleVerse}</span>
          </div>
        </div>

        <h2 style={styles.feedTitle}>Church Feed</h2>

        {user ? (
          <form onSubmit={handlePostSubmit} style={styles.postForm}>
            <div style={styles.inputContainer}>
              <input
                type="text"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                style={styles.postInput}
              />
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={styles.emojiButton}
              >
                😊
              </button>
            </div>
            {showEmojiPicker && (
              <div style={styles.emojiPickerContainer}>
                <Picker data={data} onEmojiSelect={onEmojiSelect} />
              </div>
            )}
            <button type="submit" style={styles.postButton}>Post</button>
          </form>
        ) : (
          <p style={styles.loginPrompt}>Please log in to create a post.</p>
        )}

        {feeds.map((feed) => (
          <div key={feed._id} style={styles.feedPost}>
            <div style={styles.postHeader}>
              <p style={styles.postUserName}>{feed.user.name}</p>
              {user && (user._id === feed.user._id || user.role === 'admin') && (
                <div style={styles.postActions}>
                  <button onClick={() => toggleDropdown(feed._id)} style={styles.threeDotsButton}>
                    <MoreVertical size={20} />
                  </button>
                  {activeDropdown === feed._id && (
                    <div style={styles.postActionsDropdown}>
                      <button onClick={() => setEditingPost(feed._id)} style={styles.dropdownButton}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(feed._id)} style={styles.dropdownButton}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div onClick={() => handlePostClick(feed._id)} style={styles.postContent}>
              {editingPost === feed._id ? (
                <div>
                  <textarea
                    defaultValue={feed.content}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    style={styles.editTextarea}
                  />
                  <button onClick={() => handleUpdate(feed._id, newPostContent)} style={styles.updateButton}>
                    Update
                  </button>
                  <button onClick={() => setEditingPost(null)} style={styles.cancelButton}>
                    Cancel
                  </button>
                </div>
              ) : (
                <p style={styles.content}>{feed.content}</p>
              )}
              {feed.attachments && feed.attachments.length > 0 && (
                <div style={styles.attachments}>
                  {feed.attachments.map((attachment, index) => (
                    <img 
                      key={index} 
                      src={attachment} 
                      alt="Attachment" 
                      style={styles.attachmentImage} 
                    />
                  ))}
                </div>
              )}
            </div>
            <div style={styles.reactionSection}>
              <div style={styles.reactionButtons}>
                <button 
                  style={styles.reactionButton} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction(feed._id);
                  }}
                >
                  👍 {feed.reactions.filter((reaction) => reaction.type === '👍').length}
                </button>
              </div>
              <button 
                style={styles.replyButton} 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePostClick(feed._id);
                }}
              >
                Reply
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;

