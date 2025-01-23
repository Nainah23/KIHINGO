// kihingo-frontend/src/pages/SingleTestimonial.js;
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

const EditTestimonialModal = ({ testimonial, onClose, onUpdate }) => {
  const [content, setContent] = useState(testimonial.content);
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
    await onUpdate(testimonial._id, content);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl transform transition-all duration-300 ease-out hover:scale-[1.02] shadow-2xl">
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 border rounded-lg mb-4 min-h-[150px] resize-y focus:ring-2 focus:ring-blue-500 transition-all duration-300"
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
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200">
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

const SingleTestimonial = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [testimonial, setTestimonial] = useState(null);
  const [comment, setComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedComment, setEditedComment] = useState('');
  const [isEditingTestimonial, setIsEditingTestimonial] = useState(false);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    fetchTestimonial();
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

  const fetchTestimonial = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/testimonials/${id}`);
      console.log(res.data); // Log the response data
      const sortedComments = {
        ...res.data,
        comments: res.data.comments.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
      };
      setTestimonial(sortedComments);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        alert('Testimonial not found');
        navigate('/testimonials');
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
        `http://localhost:8000/api/testimonials/${id}/comment`,
        { content: comment },
        { headers: { 'x-auth-token': token } }
      );

      setTestimonial(prevTestimonial => ({
        ...prevTestimonial,
        comments: [{
          _id: res.data._id,
          content: comment,
          user: user,
          createdAt: new Date().toISOString()
        }, ...prevTestimonial.comments]
      }));

      setComment('');
      setShowEmojiPicker(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (testimonialId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/testimonials/${testimonialId}`, {
        headers: { 'x-auth-token': token }
      }).catch(err => {
        console.error(err);
      }).catch(err => {
        console.error(err);
      });
      navigate('/testimonials');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestimonialUpdate = async (testimonialId, newContent) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:8000/api/testimonials/${testimonialId}`,
        { content: newContent },
        { headers: { 'x-auth-token': token } }
      );
      setTestimonial(prevTestimonial => ({
        ...prevTestimonial,
        content: res.data.content
      }));
      setIsEditingTestimonial(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:8000/api/testimonials/${id}/comment/${commentId}`,
        { headers: { 'x-auth-token': token } }
      ).then(() => {
        setTestimonial(prevTestimonial => ({
          ...prevTestimonial,
          comments: prevTestimonial.comments.filter(comment => comment._id !== commentId)
        }));
      });
    } catch (err) {
      console.error(err);
    }
};


  const handleCommentEdit = async (commentId, newContent) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8000/api/testimonials/${id}/comment/${commentId}`,
        { content: newContent },
        { headers: { 'x-auth-token': token } }
      );

      setTestimonial(prevTestimonial => ({
        ...prevTestimonial,
        comments: prevTestimonial.comments.map(comment =>
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

  if (!testimonial) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/testimonials')}
          className="mb-8 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          ← Back to Testimonials
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 transform transition-all duration-300 ease-out hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {testimonial.title}
              </h2>
              <p className="text-gray-600 text-sm">
                Posted by {testimonial.user.username} {formatTimeElapsed(testimonial.createdAt)}
              </p>
            </div>
            {user && user._id === testimonial.user._id && (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setIsEditingTestimonial(true)}
                  className="text-blue-600 hover:text-blue-800 transition-all duration-200"
                >
                  <Edit />
                </button>
                <button 
                  onClick={() => handleDelete(testimonial._id)}
                  className="text-red-600 hover:text-red-800 transition-all duration-200"
                >
                  <Trash />
                </button>
              </div>
            )}
          </div>
          <p className="text-gray-800 mt-4">
            {testimonial.content}
          </p>
        </div>

        {isEditingTestimonial && (
          <EditTestimonialModal
            testimonial={testimonial}
            onClose={() => setIsEditingTestimonial(false)}
            onUpdate={handleTestimonialUpdate}
          />
        )}

        <form onSubmit={handleCommentSubmit} className="mb-8">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your comment here..."
            className="w-full p-4 border rounded-lg mb-4 min-h-[100px] resize-y focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          />
          <div className="flex justify-between items-center">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-2xl hover:scale-110 transition-transform duration-200 emoji-button"
            >
              😊
            </button>
            <button 
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Post Comment
            </button>
          </div>
          {showEmojiPicker && (
            <div className="absolute mt-2">
              <Picker data={data} onEmojiSelect={(emoji) => {
                setComment(prev => prev + emoji.native);
                setShowEmojiPicker(false);
              }} />
            </div>
          )}
        </form>

        {testimonial.comments.length > 0 ? (
          testimonial.comments.map((comment) => (
            <div key={comment._id} className="bg-white rounded-2xl shadow-xl p-6 mb-4 transform transition-all duration-300 ease-out hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 font-semibold">
                    {comment.user.username}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {formatTimeElapsed(comment.createdAt)}
                  </p>
                </div>
                {user && user._id === comment.user._id && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === comment._id ? null : comment._id)}
                      className="text-gray-600 hover:text-gray-800 transition-all duration-200"
                    >
                      <MoreVertical />
                    </button>
                    {activeDropdown === comment._id && (
                      <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            setEditedComment(comment.content);
                            setEditingCommentId(comment._id);
                            setActiveDropdown(null);
                          }}
                          className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleCommentDelete(comment._id);
                            setActiveDropdown(null);
                          }}
                          className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {editingCommentId === comment._id ? (
                <div>
                  <textarea
                    value={editedComment}
                    onChange={(e) => setEditedComment(e.target.value)}
                    className="w-full p-4 border rounded-lg mt-4 min-h-[100px] resize-y focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  />
                  <div className="flex justify-end mt-4">
                    <button 
                      onClick={() => {
                        handleCommentEdit(comment._id, editedComment);
                        setEditingCommentId(null);
                      }}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingCommentId(null)}
                      className="bg-gray-200 text-gray-700 px-6 py-3 ml-4 rounded-lg hover:bg-gray-300 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 mt-4">
                  {comment.content}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};

export default SingleTestimonial;



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


// kihingo-frontend/src/pages/Report.js;
import React, { useState, useEffect, useRef } from 'react';

const ReportPage = () => {
  const [bibleVerse, setBibleVerse] = useState('');
  const verseRef = useRef(null);
  const scrollCount = useRef(0);

  // Define the fetchBibleVerse function
  const fetchBibleVerse = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/bible-verse');
      if (!res.ok) throw new Error('Failed to fetch Bible verse');
      const data = await res.json();
      setBibleVerse(data.verse);
    } catch (error) {
      console.error('Error fetching Bible verse:', error);
    }
  };

  // Start scrolling animation for the Bible verse
  const startScrollAnimation = () => {
    if (verseRef.current) {
      verseRef.current.style.animation = 'none';
      void verseRef.current.offsetHeight; // Trigger reflow
      verseRef.current.style.animation = 'scrollVerse 15s linear';
    }
  };

  // Handle the end of the scrolling animation
  const handleScrollEnd = () => {
    scrollCount.current += 1;
    if (scrollCount.current < 2) {
      startScrollAnimation();
    } else {
      scrollCount.current = 0;
      fetchBibleVerse(); // Fetch a new verse after two scroll cycles
    }
  };

  // Fetch the Bible verse when the component mounts
  useEffect(() => {
    fetchBibleVerse();
  }, []);

  // Start the scrolling animation when the Bible verse is updated
  useEffect(() => {
    if (bibleVerse) {
      startScrollAnimation();
    }
  }, [bibleVerse]);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen p-8">
      {/* Scrolling Bible Verse */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-md mb-8">
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white/90 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-800">St. Philip's Kihingo Parish 2023 Report</h1>

        {/* Church Background Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-700">Church Background</h2>
          <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            <p className="text-gray-700 leading-relaxed">
              St. Philip's Kihingo Parish was established in the year 2000 under the guidance of Bishop Emeritus Peter Njenga. The church began with a humble congregation of 18 adults and 48 Sunday school children. Over the years, the church has grown significantly, now serving over 550 members across three services: Sunday School, English, and Kikuyu services.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              The current church building, completed in 2015 at a cost of Kshs. 15 million, stands as a testament to the dedication and faith of the congregation. The church is located in a cosmopolitan area, making it accessible to a diverse community. With four active cell groups—Gicoco, Ruthiru-ini, Kihingo, and Karunga—the church continues to foster spiritual growth and community engagement.
            </p>
          </div>
        </section>

        {/* SWOT Analysis Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-700">SWOT Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold mb-2 text-purple-600">Strengths</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Dedicated clergy and leaders</li>
                <li>Growing population</li>
                <li>Good infrastructure</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold mb-2 text-purple-600">Weaknesses</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Lack of expansion space</li>
                <li>Underutilized talents</li>
                <li>Unemployment among congregants</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold mb-2 text-purple-600">Opportunities</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Metropolitan location</li>
                <li>Increasing residential units</li>
                <li>Access to utilities</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold mb-2 text-purple-600">Threats</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Competition from charismatic churches</li>
                <li>Insecurity</li>
                <li>Drug abuse among youth</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pastoral Report Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-700">Pastoral Report</h2>
          <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-600">Baptisms</h3>
                <p className="text-gray-700">18 (10 male, 8 female)</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-600">Confirmations</h3>
                <p className="text-gray-700">26 (12 male, 14 female)</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-600">Deaths</h3>
                <p className="text-gray-700">6 (4 male, 2 female)</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-600">New Members</h3>
                <p className="text-gray-700">13 (8 English service, 5 Kikuyu service)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Summary Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-700">Financial Summary</h2>
          <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            {/* <h3 className="text-xl font-semibold mb-2 text-purple-600">Children's Department</h3> */}
            <p className="text-gray-700">
              <strong>Total Income:</strong> Ksh 1,011,060<br />
              <strong>Total Expenditure:</strong> Ksh 804,000<br />
              <strong>Surplus:</strong> Ksh 207,060
            </p>
          </div>
        </section>

        {/* Conclusion Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-700">Conclusion</h2>
          <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            <p className="text-gray-700 leading-relaxed">
              The year 2023 was a year of growth and challenges for St. Philip's Kihingo Parish. Despite economic hardships, the church achieved significant milestones in pastoral care, fundraising, and community engagement. We look forward to an even more fruitful 2024.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportPage;