
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import NotificationsPane from '../components/NotificationsPane';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Bell, MessageCircle, ThumbsUp, Edit, Trash } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// Utility functions remain unchanged
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

// ApiService class remains unchanged
class ApiService {
  // ... (keep existing ApiService implementation)
}

// EditPostModal Component with Tailwind
const EditPostModal = ({ post, onClose, onUpdate }) => {
  const [content, setContent] = useState(post?.content || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emojiPickerRef = useRef(null);

  // ... (keep existing useEffect and handlers)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl transform transition-all duration-300 ease-in-out" 
           onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 border rounded-lg mb-4 min-h-[150px] resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="What's on your mind?"
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
              >
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

// Main Feed Component with Tailwind
const Feed = () => {
  // ... (keep existing state and hooks)

  // Component rendering with Tailwind classes
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-purple-100 p-6 shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <div className="text-center mb-8">
          <img
            src={userProfileImage}
            alt="User Profile"
            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg transform hover:scale-105 transition-all duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-profile.png';
            }}
          />
          <h3 className="text-xl font-bold text-purple-800">{user.name || 'Guest'}</h3>
          <p className="text-purple-600">@{user.username || 'guest'}</p>
        </div>

        <NotificationsPane 
          notifications={notifications}
          formatTimeElapsed={formatTimeElapsed}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transform hover:scale-105 transition-all duration-200"
        >
          Back Home
        </button>

        {/* Bible Verse */}
        <div className="bg-purple-100 p-4 rounded-lg mb-8 overflow-hidden">
          <div className="relative">
            <p
              ref={verseRef}
              className="text-purple-800 whitespace-nowrap animate-scroll"
            >
              {bibleVerse || 'Loading verse...'}
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Church Feed
        </h2>

        {/* Post Form */}
        <form onSubmit={handlePostSubmit} className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
            <div className="relative">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
              />
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute top-4 right-4 text-2xl hover:scale-110 transition-transform duration-200"
              >
                😊
              </button>
              {showEmojiPicker && (
                <div className="absolute right-0 mt-2 z-50" ref={emojiPickerRef}>
                  <Picker data={data} onEmojiSelect={onEmojiSelect} />
                </div>
              )}
            </div>
            <button 
              type="submit"
              disabled={!newPostContent.trim() || isSubmitting}
              className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </form>

        {/* Feed Items */}
        {feeds.map((feed) => (
          feed && (
            <div 
              key={feed._id} 
              className="bg-white rounded-lg shadow-lg p-6 mb-6 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-purple-800 hover:text-purple-600 cursor-pointer transition-colors duration-200">
                    {feed.user.name}
                  </span>
                  <span
                    className="text-purple-600 hover:text-purple-800 cursor-pointer transition-colors duration-200"
                    onClick={(e) => handleAuthorClick(e, feed.user.username)}
                  >
                    @{feed.user.username}
                  </span>
                  <span className="text-gray-500 text-sm">{formatTimeElapsed(feed.createdAt)}</span>
                </div>
                
                {user && (user._id === feed.user._id || user.role === 'admin') && (
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(feed._id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {activeDropdown === feed._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                        <button 
                          onClick={() => setEditingPost(feed)}
                          className="w-full px-4 py-2 text-left hover:bg-purple-50 flex items-center gap-2 transition-colors duration-200"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(feed._id)}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 transition-colors duration-200 text-red-600"
                        >
                          <Trash size={16} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p 
                onClick={() => handlePostClick(feed._id)}
                className="text-gray-800 mb-4 cursor-pointer hover:text-purple-800 transition-colors duration-200"
              >
                {feed.content}
              </p>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  onClick={() => handleReaction(feed._id)}
                  className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  <ThumbsUp size={18} />
                  <span>{feed.reactions?.length || 0}</span>
                </button>
                <button
                  onClick={() => handlePostClick(feed._id)}
                  className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  <MessageCircle size={18} />
                  <span>{feed.comments?.length || 0}</span>
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