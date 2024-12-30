// SinglePost.js
import React, { useState, useEffect, useContext, useRef } from 'react';
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl transform transition-all duration-300 ease-out hover:scale-[1.02] shadow-2xl">
        <form onSubmit={(e) => {
          e.preventDefault();
          onUpdate(post._id, content);
        }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 border rounded-lg mb-4 min-h-[150px] resize-y focus:ring-2 focus:ring-purple-500 transition-all duration-300"
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
              <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transform hover:scale-105 transition-all duration-200">
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
              <Picker data={data} onEmojiSelect={(emoji) => {
                setContent(prev => prev + emoji.native);
                setShowEmojiPicker(false);
              }} />
            </div>
          )}
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
      const sortedComments = {
        ...res.data,
        comments: res.data.comments.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
      };
      setPost(sortedComments);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
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
        comments: [{
          _id: res.data._id,
          content: comment,
          user: user,
          createdAt: new Date().toISOString()
        }, ...prevPost.comments]
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

  if (!post) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/feed')}
          className="mb-8 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          ← Back to Feed
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 transform transition-all duration-500 hover:shadow-2xl animate-slideUp">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-purple-800">{post.user.name}</h2>
              <p className="text-gray-600 cursor-pointer hover:text-purple-600 transition-colors">
                @{post.user.username}
              </p>
              <p className="text-gray-500 text-sm">{formatTimeElapsed(post.createdAt)}</p>
            </div>
            
            {user && (user._id === post.user._id || user.role === 'admin') && (
              <div className="relative">
                <button 
                  onClick={() => setActiveDropdown(activeDropdown ? null : 'post')}
                  className="p-2 hover:bg-purple-100 rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                
                {activeDropdown === 'post' && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 animate-fadeIn">
                    <button 
                      onClick={() => setIsEditingPost(true)}
                      className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(post._id)}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-lg text-gray-800 mb-6">{post.content}</p>

          <div className="flex items-center mb-6">
            <button 
              onClick={handleReaction}
              className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <span className="text-2xl">👍</span>
              <span className="font-medium">
                {post.reactions.length} {/*post.reactions.length === 1 ? 'reaction' : 'reactions'*/}
              </span>
            </button>
          </div>

          {user && (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform duration-200"
                  >
                    😊
                  </button>
                </div>
                <button 
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Comment
                </button>
              </div>
              {showEmojiPicker && (
                <div className="absolute mt-2 z-50" ref={emojiPickerRef}>
                  <Picker 
                    data={data} 
                    onEmojiSelect={(emoji) => {
                      setComment(prev => prev + emoji.native);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}
            </form>
          )}

          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-purple-800 mb-4">Comments</h3>
            {post.comments.map((comment, index) => (
              <div 
                key={comment._id}
                className="bg-gray-50 rounded-lg p-4 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-md animate-slideIn"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-purple-800">{comment.user.name}</p>
                    <p className="text-gray-600 text-sm">@{comment.user.username}</p>
                    <p className="text-gray-500 text-xs mt-1">{formatTimeElapsed(comment.createdAt)}</p>
                  </div>
                  
                  {user && (user._id === comment.user._id || user.role === 'admin') && (
                    <div className="relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === comment._id ? null : comment._id)}
                        className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      {activeDropdown === comment._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 animate-fadeIn">
                          <button 
                            onClick={() => {
                              setEditingCommentId(comment._id);
                              setEditedComment(comment.content);
                            }}
                            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleCommentDelete(comment._id)}
                            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="mt-2 text-gray-800">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {isEditingPost && (
        <EditPostModal
          post={post}
          onClose={() => setIsEditingPost(false)}
          onUpdate={handlePostUpdate}
        />
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SinglePost;