import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Edit, Trash, MoreVertical, Heart } from 'lucide-react';
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
  const [bibleVerse, setBibleVerse] = useState('');
  const verseRef = useRef(null);
  const scrollCount = useRef(0);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    fetchTestimonial();
    fetchBibleVerse();
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

  const startScrollAnimation = () => {
    if (verseRef.current) {
      verseRef.current.style.animation = 'none';
      void verseRef.current.offsetHeight; // Trigger reflow
      verseRef.current.style.animation = 'scrollVerse 15s linear';
    }
  };

  const handleScrollEnd = () => {
    scrollCount.current += 1;
    if (scrollCount.current < 2) {
      startScrollAnimation();
    } else {
      scrollCount.current = 0;
      fetchBibleVerse(); // Fetch a new verse after two scroll cycles
    }
  };

  useEffect(() => {
    if (bibleVerse) {
      startScrollAnimation();
    }
  }, [bibleVerse]);

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

  const handleReaction = async () => {
    if (!user) {
      alert('Please login to react.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const existingReaction = testimonial.reactions.find(r => r.user === user._id);

      const res = await axios.post(
        `http://localhost:8000/api/testimonials/${id}/react`,
        {
          type: '👍',
          action: existingReaction ? 'remove' : 'add'
        },
        { headers: { 'x-auth-token': token } }
      );

      setTestimonial(prevTestimonial => ({
        ...prevTestimonial,
        reactions: res.data.reactions
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (testimonialId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/testimonials/${testimonialId}`, {
        headers: { 'x-auth-token': token }
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
      {/* Scrolling Bible Verse */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-md mb-8">
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white/90 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="overflow-hidden">
              <p
                ref={verseRef}
                className="text-blue-700 italic text-sm animate-scroll"
                onAnimationEnd={handleScrollEnd}
              >
                {bibleVerse || 'Loading verse...'}
              </p>
            </div>
          </div>
        </div>
      </div>

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

          {/* Reaction Button */}
          <div className="flex items-center mt-4">
            <button
              onClick={handleReaction}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Heart className="w-5 h-5" />
              <span className="font-medium">
                {testimonial.reactions?.length || 0}
              </span>
            </button>
          </div>
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