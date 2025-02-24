// kihingo-frontend/src/pages/Testimonials.js;

import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Bell, MessageCircle, ThumbsUp, Edit, Trash } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

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

  async fetchTestimonials() {
    try {
      const { data: testimonials } = await axios.get(`${this.baseUrl}/api/testimonials`, this.getHeaders());
      
      const testimonialsWithUserDetails = await Promise.all(
        testimonials.map(async (testimonial) => {
          try {
            if (!testimonial.user?.username) {
              console.warn(`No username found for testimonial ${testimonial._id}`);
              return testimonial;
            }

            const { data: userDetails } = await axios.get(
              `${this.baseUrl}/api/auth/profile/${testimonial.user.username}`,
              this.getHeaders()
            );
            
            return {
              ...testimonial,
              user: {
                ...testimonial.user,
                ...userDetails,
                profileImage: await this.getImageUrl(userDetails.profileImage)
              }
            };
          } catch (err) {
            console.error(`Error fetching user details for testimonial ${testimonial._id}:`, err);
            return testimonial;
          }
        })
      );
      
      return testimonialsWithUserDetails;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async fetchNotifications() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/notifications`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async createTestimonial(content) {
    try {
      const { data: newTestimonial } = await axios.post(
        `${this.baseUrl}/api/testimonials`,
        { content },
        this.getHeaders()
      );
      
      const { data: userDetails } = await axios.get(
        `${this.baseUrl}/api/auth/profile/${newTestimonial.user.username}`,
        this.getHeaders()
      );
      
      return {
        ...newTestimonial,
        user: {
          ...newTestimonial.user,
          ...userDetails,
          profileImage: await this.getImageUrl(userDetails.profileImage)
        }
      };
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async updateTestimonial(testimonialId, content) {
    try {
      const { data: updatedTestimonial } = await axios.put(
        `${this.baseUrl}/api/testimonials/${testimonialId}`,
        { content },
        this.getHeaders()
      );
      
      const { data: userDetails } = await axios.get(
        `${this.baseUrl}/api/auth/profile/${updatedTestimonial.user.username}`,
        this.getHeaders()
      );
      
      return {
        ...updatedTestimonial,
        user: {
          ...updatedTestimonial.user,
          ...userDetails,
          profileImage: await this.getImageUrl(userDetails.profileImage)
        }
      };
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async deleteTestimonial(testimonialId) {
    try {
      await axios.delete(
        `${this.baseUrl}/api/testimonials/${testimonialId}`,
        this.getHeaders()
      );
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async handleReaction(testimonialId, type, action) {
    try {
      const { data } = await axios.post(
        `${this.baseUrl}/api/testimonials/${testimonialId}/react`,
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

// EditTestimonialModal Component
const EditTestimonialModal = ({ testimonial, onClose, onUpdate }) => {
  const [content, setContent] = useState(testimonial?.content || '');
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
    if (!testimonial?._id || !content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onUpdate(testimonial._id, content);
      onClose();
    } catch (error) {
      console.error('Failed to update testimonial:', error);
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
            className="w-full p-4 border rounded-xl mb-4 min-h-[150px] resize-y focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Share your testimony..."
          />
          <div className="flex justify-between items-center">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-2xl hover:scale-110 transition-transform duration-200 p-2 rounded-full hover:bg-amber-50"
            >
              😊
            </button>
            <div className="space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-full font-medium transform hover:scale-105 transition-all duration-300 disabled:opacity-50 hover:shadow-lg"
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

// Main Testimonials Component
const Testimonials = () => {
  const { user } = useContext(AuthContext);
  const [testimonials, setTestimonials] = useState([]);
  const [newTestimonialContent, setNewTestimonialContent] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');
  const [editingTestimonial, setEditingTestimonial] = useState(null);
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
    }
  };

  const startScrollAnimation = () => {
    setIsScrolling(true);
    if (verseRef.current) {
      verseRef.current.style.animation = 'none';
      void verseRef.current.offsetHeight;
      verseRef.current.style.animation = 'scrollVerse 15s linear';
    }
  };

  const handleScrollEnd = () => {
    scrollCount.current += 1;
    if (scrollCount.current < 2) {
      startScrollAnimation();
    } else {
      setIsScrolling(false);
      fetchBibleVerse();
    }
  };

  const fetchBibleVerse = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/bible-verse');
      if (!res.ok) throw new Error('Failed to fetch Bible verse');
      const data = await res.json();
      if (!isScrolling) {
        setBibleVerse(data.verse);
        scrollCount.current = 0;
        startScrollAnimation();
      }
    } catch (error) {
      console.error('Error fetching Bible verse:', error);
    }
  }, [isScrolling]);

  const handleTestimonialClick = (testimonialId) => {
    navigate(`/testimonials/${testimonialId}`);
  };

  const toggleDropdown = (testimonialId) => {
    setActiveDropdown(prev => prev === testimonialId ? null : testimonialId);
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

        if (user?.profileImage) {
          const imageUrl = await api.getImageUrl(user.profileImage);
          setUserProfileImage(imageUrl);
        }

        const [testimonialsData, notificationsData] = await Promise.all([
          api.fetchTestimonials(),
          api.fetchNotifications().catch(() => []),
        ]);

        setTestimonials(testimonialsData);
        setNotifications(notificationsData);

        fetchBibleVerse();

      } catch (err) {
        setError('Failed to load testimonials data. Please try refreshing the page.');
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    timeUpdateInterval.current = setInterval(() => {
      setTestimonials(prevTestimonials => [...prevTestimonials]);
    }, 60000);

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, [user, api, fetchBibleVerse]);

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newTestimonialContent.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newTestimonial = await api.createTestimonial(newTestimonialContent);
      const completeTestimonial = {
        ...newTestimonial,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          ...newTestimonial.user
        },
        reactions: [],
        comments: [],
        createdAt: new Date().toISOString()
      };

      setTestimonials(prevTestimonials => [completeTestimonial, ...prevTestimonials]);
      setNewTestimonialContent('');
    } catch (err) {
      setError('Failed to create testimonial. Please try again.');
      console.error('Error creating testimonial:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (testimonialId, newContent) => {
    if (!newContent.trim()) return;

    try {
      const updatedTestimonial = await api.updateTestimonial(testimonialId, newContent);
      setTestimonials(prevTestimonials =>
        prevTestimonials.map(testimonial =>
          testimonial._id === testimonialId ? updatedTestimonial : testimonial
        )
      );
      setEditingTestimonial(null);
    } catch (err) {
      setError('Failed to update testimonial. Please try again.');
      console.error('Error updating testimonial:', err);
    }
  };

  const handleDelete = async (testimonialId) => {
    if (!window.confirm('Are you sure you want to delete this testimony?')) return;

    try {
      await api.deleteTestimonial(testimonialId);
      setTestimonials(prevTestimonials => 
        prevTestimonials.filter(testimonial => testimonial._id !== testimonialId)
      );
    } catch (err) {
      setError('Failed to delete testimonial. Please try again.');
      console.error('Error deleting testimonial:', err);
    }
  };

  const handleReaction = async (testimonialId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const testimonial = testimonials.find(t => t._id === testimonialId);
      if (!testimonial) return;

      const existingReaction = testimonial.reactions?.find(r => r.user === user._id);
      const { reactions } = await api.handleReaction(
        testimonialId,
        '👍',
        existingReaction ? 'remove' : 'add'
      );

      setTestimonials(prevTestimonials =>
        prevTestimonials.map(testimonial =>
          testimonial._id === testimonialId ? { ...testimonial, reactions } : testimonial
        )
      );
    } catch (err) {
      console.error('Error handling reaction:', err);
      setError('Failed to update reaction. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-ping"></div>
        <div className="absolute inset-0 border-4 border-amber-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-red-50 text-red-600 px-6 py-4 rounded-lg shadow-lg">
        {error}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Fixed Sidebar */}
      <div className="w-80 bg-white/80 backdrop-blur-lg p-6 shadow-2xl fixed h-full transform transition-all duration-300 hover:shadow-amber-200/50 border-r border-amber-100/50 overflow-y-auto">
        {/* Profile Section */}
        <div className="text-center mb-8 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
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
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
              {user?.name || 'Guest'}
            </h3>
            <p className="text-amber-600">@{user?.username || 'guest'}</p>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent">
          <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5" />
            Notifications
          </h4>
          {notifications.map((notification, index) => (
            <div
              key={notification._id || index}
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-amber-100/50 transform hover:-translate-y-1 hover:scale-[1.02]"
            >
              <p className="text-sm text-gray-600">{notification.content}</p>
              <span className="text-xs text-amber-500">{formatTimeElapsed(notification.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-80 p-6 space-y-6">
        {/* Bible Verse Banner */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-md">
          <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white/90 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="overflow-hidden">
                <p
                  ref={verseRef}
                  className="text-amber-700 italic text-sm animate-scroll"
                  onAnimationEnd={handleScrollEnd}
                >
                  {bibleVerse || 'Loading verse...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-6 space-y-6">
          {/* Navigation Button */}
          <button 
            onClick={() => navigate('/')}
            className="mb-6 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 text-amber-600 font-medium transform hover:-translate-y-1"
          >
            Back Home
          </button>

          <h2 className="text-2xl font-bold text-amber-800">Testimonials</h2>

          {/* Testimonial Creation Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl border border-amber-100/50">
            <form onSubmit={handleTestimonialSubmit} className="space-y-4">
              <div className="flex gap-4 items-start">
                <img
                  src={userProfileImage}
                  alt="Your Profile"
                  className="w-12 h-12 rounded-full border-2 border-amber-200"
                />
                <div className="flex-1 space-y-4">
                  <textarea
                    value={newTestimonialContent}
                    onChange={(e) => setNewTestimonialContent(e.target.value)}
                    placeholder="Share your testimony..."
                    className="w-full resize-none rounded-xl border-amber-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent min-h-[100px] transition-all duration-300 p-4"
                  />
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-2xl hover:scale-110 transition-transform duration-200 p-2 rounded-full hover:bg-amber-50"
                    >
                      😊
                    </button>
                    <button
                      type="submit"
                      disabled={!newTestimonialContent.trim() || isSubmitting}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-full font-medium transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                    >
                      Share Testimony
                    </button>
                  </div>
                  {showEmojiPicker && (
                    <div className="absolute mt-2" ref={emojiPickerRef}>
                      <Picker 
                        data={data} 
                        onEmojiSelect={(emoji) => {
                          setNewTestimonialContent(prev => prev + emoji.native);
                          setShowEmojiPicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Testimonials List */}
          <div className="space-y-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial._id}
                className="bg-white rounded-2xl shadow-lg p-6 space-y-4 transform transition-all duration-300 hover:shadow-2xl border border-amber-100/50 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={testimonial.user.profileImage || '/default-profile.png'}
                    alt={testimonial.user.name}
                    className="w-12 h-12 rounded-full border-2 border-amber-200 cursor-pointer transform hover:scale-105 transition-all duration-300"
                    onClick={(e) => handleAuthorClick(e, testimonial.user.username)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span 
                          className="font-semibold text-gray-900 hover:text-amber-600 cursor-pointer"
                          onClick={(e) => handleAuthorClick(e, testimonial.user.username)}
                        >
                          {testimonial.user.name}
                        </span>
                        <span className="text-gray-500 ml-2">@{testimonial.user.username}</span>
                        <span className="text-gray-400 text-sm ml-2">· {formatTimeElapsed(testimonial.createdAt)}</span>
                      </div>
                      {user && (user._id === testimonial.user._id || user.role === 'admin') && (
                        <div className="relative">
                          <button
                            onClick={() => toggleDropdown(testimonial._id)}
                            className="p-2 hover:bg-amber-50 rounded-full transition-colors duration-200"
                          >
                            <MoreVertical size={20} className="text-gray-500" />
                          </button>
                          {activeDropdown === testimonial._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-10 border border-amber-100/50 transform transition-all duration-200 animate-fadeIn">
                              <button
                                onClick={() => setEditingTestimonial(testimonial)}
                                className="w-full px-4 py-2 text-left hover:bg-amber-50 flex items-center gap-2"
                              >
                                <Edit size={16} className="text-amber-600" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(testimonial._id)}
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
                    <p className="mt-2 text-gray-800 whitespace-pre-wrap">{testimonial.content}</p>
                    <div className="flex gap-6 mt-4">
                      <button
                        onClick={() => handleReaction(testimonial._id)}
                        className="group flex items-center gap-2 text-gray-500 hover:text-amber-600 transition-colors duration-200"
                      >
                        <div className="relative">
                          <ThumbsUp
                            size={20}
                            className={`transform transition-all duration-300 group-hover:scale-125 ${
                              testimonial.reactions?.some(r => r.user === user?._id)
                                ? 'text-amber-600 scale-110'
                                : ''
                            }`}
                          />
                          <div className="absolute inset-0 bg-amber-400 rounded-full transform scale-110 opacity-0 group-hover:animate-ping" />
                        </div>
                        <span className="group-hover:font-medium">
                          {testimonial.reactions?.length || 0}
                        </span>
                      </button>
                      <button
                        onClick={() => handleTestimonialClick(testimonial._id)}
                        className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
                      >
                        <MessageCircle
                          size={20}
                          className="transform transition-all duration-300 group-hover:scale-125"
                        />
                        <span className="group-hover:font-medium">
                          {testimonial.comments?.length || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editingTestimonial && (
          <EditTestimonialModal
            testimonial={editingTestimonial}
            onClose={() => setEditingTestimonial(null)}
            onUpdate={handleUpdate}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes scrollVerse {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-scroll {
          animation: scrollVerse 15s linear;
          white-space: nowrap;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #fcd34d;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
};

export default Testimonials;