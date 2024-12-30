import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import NotificationsPane from '../components/NotificationsPane';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Bell, MessageCircle, ThumbsUp, Edit, Trash } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';


// Utility functions remain the same
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

// API service class remains the same
class ApiService {
  // ... [Keep existing ApiService implementation]
}

// EditPostModal Component with enhanced styling
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
  // ... [Keep all existing state declarations and hooks]

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

        {/* Bible Verse Section */}
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