import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Bell, MessageCircle, ThumbsUp } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import '../styles/Feed.css';

// ... (keep all utility functions and ApiService class the same until fetchFeeds method)

// Update the ApiService class's fetchFeeds method:
class ApiService {
  // ... (previous methods remain the same)

  async fetchFeeds() {
    try {
      const { data: feeds } = await axios.get(`${this.baseUrl}/api/feed`, this.getHeaders());
      
      // Fetch complete user details for each feed
      const feedsWithUserDetails = await Promise.all(
        feeds.map(async (feed) => {
          try {
            if (!feed.user?.username) {
              console.warn(`No username found for feed ${feed._id}`);
              return feed;
            }

            const { data: userDetails } = await axios.get(
              `${this.baseUrl}/api/auth/profile/${feed.user.username}`,
              this.getHeaders()
            );
            
            return {
              ...feed,
              user: {
                ...feed.user,
                ...userDetails,
                profileImage: await this.getImageUrl(userDetails.profileImage)
              }
            };
          } catch (err) {
            console.error(`Error fetching user details for feed ${feed._id}:`, err);
            return feed;
          }
        })
      );
      
      return feedsWithUserDetails;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  // ... (other methods remain the same)
}

// ... (EditPostModal component remains the same)

// Update the Feed component:
const Feed = () => {
  // ... (previous state declarations remain the same)

  const handleAuthorClick = (e, username) => {
    e.preventDefault();
    e.stopPropagation();
    if (username) {
      navigate(`/profile/${username}`);
    } else {
      console.warn('No username provided for profile navigation');
    }
  };

  // ... (other handler functions remain the same)

  // Update the feeds.map section in the return statement:
  return (
    <div className="feed-container">
      {/* ... (previous JSX remains the same until feeds.map) ... */}
      
      {feeds.map((feed) => (
        feed && (
          <div key={feed._id} className="feed-item">
            <div className="feed-header">
              <div className="author-info">
                <img
                  src={feed.user?.profileImage || '/default-profile.png'}
                  alt={`${feed.user?.name}'s profile`}
                  className="author-profile-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-profile.png';
                  }}
                />
                <span 
                  className="author-name"
                  onClick={(e) => handleAuthorClick(e, feed.user?.username)}
                  style={{ cursor: 'pointer' }}
                >
                  {feed.user?.name || 'Unknown User'}
                </span>
                <span className="author-username">
                  @{feed.user?.username || 'unknown'}
                </span>
                <span className="feed-time">
                  {formatTimeElapsed(feed.createdAt)}
                </span>
              </div>
              {user && user._id === feed.user?._id && (
                <div className="dropdown-wrapper">
                  <MoreVertical 
                    onClick={() => toggleDropdown(feed._id)}
                    className="dropdown-icon"
                  />
                  {activeDropdown === feed._id && (
                    <div className="dropdown-menu">
                      <button 
                        className="edit-button"
                        onClick={() => setEditingPost(feed)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDelete(feed._id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p onClick={() => handlePostClick(feed._id)} className="feed-content">
              {feed.content}
            </p>
            <div className="reactions">
              <button 
                onClick={() => handleReaction(feed._id)} 
                className="reaction-button"
              >
                <ThumbsUp size={18} /> {feed.reactions?.length || 0}
              </button>
              <button 
                onClick={() => handlePostClick(feed._id)} 
                className="comment-button"
              >
                <MessageCircle size={18} /> {feed.comments?.length || 0}
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
  );
};

export default Feed;