// src/pages/SinglePost.js;
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Edit, Trash, MoreVertical } from 'lucide-react';
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
              {formatTimeElapsed(post.createdAt)}
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
                    onClick={() => setIsEditingPost(true)}
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

        {isEditingPost ? (
          <EditPostModal
            post={post}
            onClose={() => setIsEditingPost(false)}
            onUpdate={handlePostUpdate}
          />
        ) : (
          <>
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
          </>
        )}

        <div style={styles.reactionSection}>
          <button 
            onClick={handleReaction}
            style={styles.reactionButton}
          >
            👍 {post.reactions.length}
          </button>
        </div>

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
                {formatTimeElapsed(comment.createdAt)}
              </span>
            </div>
          ))}
        </div>
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
  backButton: {
    backgroundColor: '#a1626a',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  postContent: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    color: '#a1626a',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  postTime: {
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
    backgroundColor: 'white',
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
  },
  postBody: {
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  attachments: {
    marginBottom: '20px',
  },
  attachmentImage: {
    maxWidth: '100%',
    borderRadius: '5px',
    marginBottom: '10px',
  },
  reactionSection: {
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
    padding: '10px 0',
    marginBottom: '20px',
  },
  reactionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2em',
  },
  commentForm: {
    marginBottom: '20px',
  },
  commentInputContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  commentInput: {
    flex: 1,
    padding: '10px',
    borderRadius: '5px',
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
  },
  submitButton: {
    backgroundColor: '#a1626a',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  commentsSection: {
    marginTop: '20px',
  },
  comment: {
    borderBottom: '1px solid #eee',
    padding: '15px 0',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px',
  },
  commentUserName: {
    color: '#a1626a',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  commentActions: {
    position: 'relative',
  },
  commentContent: {
    marginBottom: '5px',
  },
  commentTime: {
    color: '#666',
    fontSize: '0.9em',
  },
  editCommentForm: {
    marginTop: '10px',
  },
  editCommentInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginBottom: '10px',
  },
  editCommentButtons: {
      display: 'flex',
      gap: '10px',
    },
    editButton: {
      backgroundColor: '#a1626a',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '5px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#8d5459',
      },
    },
    cancelButton: {
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '5px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#5a6268',
      },
    }
  };

export default SinglePost;