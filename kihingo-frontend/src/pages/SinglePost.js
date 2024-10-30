// SinglePost.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Edit, Trash, MoreVertical } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import '../styles/SinglePost.css';

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
    await onUpdate(post._id, content);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="edit-textarea"
          />
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
                    setContent(prev => prev + emoji.native);
                  }} 
                />
              </div>
            )}
          </div>
          <div className="modal-buttons">
            <button type="submit" className="update-button">Update</button>
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  const [isEditingPost, setIsEditingPost] = useState(false);
  const emojiPickerRef = useRef(null);
  const commentInputRef = useRef(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) &&
          !event.target.classList.contains('emoji-button')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handlePostUpdate = async (postId, newContent) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:8000/api/feed/${postId}`,
        { content: newContent },
        { headers: { 'x-auth-token': token } }
      );
      setPost(prevPost => ({
        ...prevPost,
        content: res.data.content
      }));
      setIsEditingPost(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentEdit = async (commentId, newContent) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
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
  };

  const handleUserClick = (e, username) => {
    e.preventDefault();
    e.stopPropagation();
    if (username) {
      navigate(`/profile/${username}`);
    } else {
      console.warn('No username provided for profile navigation');
    }
  };

  if (!post) return <div>Loading...</div>;

  return (
    <div className="single-post-container">
      <button className="back-button" onClick={() => navigate('/feed')}>
        Back to Feed
      </button>

      <div className="post-content">
        <div className="post-header">
          <div className="user-info">
            <span className="author-name">{post.user.name}</span>
          <span 
          className="author-username"
          onClick={(e) => handleUserClick(e, post.user.username)}
          style={{ cursor: 'pointer' }}
        >
          @{post.user.username}
        </span>
            <span className="post-time">
              {formatTimeElapsed(post.createdAt)}
            </span>
          </div>
          {user && (user._id === post.user._id || user.role === 'admin') && (
            <div className="post-actions">
              <button 
                onClick={() => setActiveDropdown(activeDropdown ? null : 'post')}
                className="action-button"
              >
                <MoreVertical size={20} />
              </button>
              {activeDropdown === 'post' && (
                <div className="dropdown">
                  <button 
                    onClick={() => setIsEditingPost(true)}
                    className="dropdown-button"
                  >
                    <Edit size={16} className="dropdown-icon" />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(post._id)}
                    className="dropdown-button"
                  >
                    <Trash size={16} className="dropdown-icon" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditingPost ? (
          <EditPostModal
            post={post}
            onClose={() => setIsEditingPost(false)}
            onUpdate={handlePostUpdate}
          />
        ) : (
          <>
            <p className="post-body">{post.content}</p>

            {post.attachments && post.attachments.length > 0 && (
              <div className="attachments">
                {post.attachments.map((attachment, index) => (
                  <img 
                    key={index} 
                    src={attachment} 
                    alt="Attachment" 
                    className="attachment-image"
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className="reaction-section">
          <button 
            onClick={handleReaction}
            className="reaction-button"
          >
            👍 {post.reactions.length}
          </button>
        </div>

        {user && (
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <div className="comment-input-wrapper">
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
                    <Picker data={data} onEmojiSelect={onEmojiSelect} />
                  </div>
                )}
              </div>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="comment-input"
                ref={commentInputRef}
              />
            </div>
            <button type="submit" className="submit-button">
              Comment
            </button>
          </form>
        )}

        <div className="comments-section">
          <h3>Comments</h3>
          {post.comments.map((comment) => (
            <div key={comment._id} className="comment">
              <div className="comment-header">
                <span className="comment-user-name">{comment.user.name}</span>
                <span 
                  onClick={(e) => handleUserClick(e, comment.user.username)}
                  className="comment-user-name"
                >
                  @{comment.user.username}
                </span>
                {user && (user._id === comment.user._id || user.role === 'admin') && (
                  <div className="comment-actions">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === comment._id ? null : comment._id)}
                      className="action-button"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeDropdown === comment._id && (
                      <div className="dropdown">
                        <button 
                          onClick={() => {
                            setEditingCommentId(comment._id);
                            setEditedComment(comment.content);
                          }}
                          className="dropdown-button"
                        >
                          <Edit size={16} className="dropdown-icon" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleCommentDelete(comment._id)}
                          className="dropdown-button"
                        >
                          <Trash size={16} className="dropdown-icon" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {editingCommentId === comment._id ? (
                <div className="edit-comment-form">
                  <input
                    type="text"
                    value={editedComment}
                    onChange={(e) => setEditedComment(e.target.value)}
                    className="edit-comment-input"
                  />
                  <div className="edit-comment-buttons">
                    <button 
                      onClick={() => handleCommentEdit(comment._id, editedComment)}
                      className="edit-button"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditedComment('');
                      }}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="comment-content">{comment.content}</p>
              )}
              <span className="comment-time">
                {formatTimeElapsed(comment.createdAt)}
              </span>
            </div>
          ))}
          </div>
      </div>
    </div>
  );
};

export default SinglePost;