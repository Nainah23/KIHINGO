import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import '../styles/Testimonials.css';
import { MessageCircle, ThumbsUp, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [newTestimonialContent, setNewTestimonialContent] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [randomVerse, setRandomVerse] = useState('');
  const scrollCount = useRef(0);
  const verseRef = useRef(null);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const loggedInUserId = localStorage.getItem('userId');

  const fetchRandomBibleVerse = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/bible-verse');
      if (!res.ok) throw new Error('Failed to fetch Bible verse');
      const data = await res.json();
      // Only update verse if not currently scrolling
      if (!isScrolling) {
        setRandomVerse(data.verse);
        scrollCount.current = 0;
        startScrollAnimation();
      }
    } catch (error) {
      console.error('Error fetching Bible verse:', error);
    }
  }, [isScrolling]);

  const startScrollAnimation = () => {
    setIsScrolling(true);
    if (verseRef.current) {
      verseRef.current.style.animation = 'none';
      // Properly trigger reflow
      void verseRef.current.offsetHeight;
      verseRef.current.style.animation = 'scrollVerse 15s linear';
    }
  };

  const handleScrollEnd = () => {
    scrollCount.current += 1;
    if (scrollCount.current < 2) {
      // Start another scroll cycle
      startScrollAnimation();
    } else {
      // After two complete scrolls, fetch new verse
      setIsScrolling(false);
      fetchRandomBibleVerse();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null); // Close dropdown if clicked outside
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/testimonials');
      setTestimonials(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch testimonials. Please try again.');
    }
  };

  useEffect(() => {
    fetchRandomBibleVerse();
    fetchTestimonials();
  }, [fetchRandomBibleVerse]);

  const handlePostTestimonial = async (e) => {
    e.preventDefault();
    if (!newTestimonialContent.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const { data: newTestimonial } = await axios.post(
        'http://localhost:8000/api/testimonials',
        { content: newTestimonialContent },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      setTestimonials([newTestimonial, ...testimonials]);
      setNewTestimonialContent('');
    } catch (err) {
      console.error(err);
      setError('Failed to post testimonial. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestimonialReaction = async (testimonialId, type) => {
    try {
      const { data: reactions } = await axios.post(
        `http://localhost:8000/api/testimonials/${testimonialId}/react`,
        { type }
      );
      setTestimonials((prevTestimonials) =>
        prevTestimonials.map((t) =>
          t._id === testimonialId ? { ...t, reactions } : t
        )
      );
    } catch (err) {
      console.error(err);
      setError('Failed to update reaction. Please try again.');
    }
  };

  const handleTestimonialComment = async (testimonialId, content) => {
    try {
      const { data: comments } = await axios.post(
        `http://localhost:8000/api/testimonials/${testimonialId}/comment`,
        { content }
      );
      setTestimonials((prevTestimonials) =>
        prevTestimonials.map((t) =>
          t._id === testimonialId ? { ...t, comments } : t
        )
      );
    } catch (err) {
      console.error(err);
      setError('Failed to add comment. Please try again.');
    }
  };

  const handleAuthorClick = (e, username) => {
    e.preventDefault();
    e.stopPropagation();
    if (username) {
      navigate(`/profile/${username}`);
    } else {
      console.warn('No username provided for profile navigation');
    }
  };

  const toggleDropdown = (testimonialId) => {
    setActiveDropdown((prev) => (prev === testimonialId ? null : testimonialId));
  };

  const handleUpdate = async (testimonialId, newContent) => {
    try {
      if (!testimonialId) {
        console.error("Testimonial ID is undefined");
        setError("Testimonial ID is missing. Unable to update.");
        return;
      }
      const { data: updatedTestimonial } = await axios.put(
        `http://localhost:8000/api/testimonials/${testimonialId}`,
        { content: newContent },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      setTestimonials((prevTestimonials) =>
        prevTestimonials.map((t) =>
          t._id === testimonialId ? updatedTestimonial : t
        )
      );
      setEditingTestimonial(null);
    } catch (err) {
      console.error(err);
      setError('Failed to update testimonial. Please try again.');
    }
  };  

  const handleDelete = async (testimonialId) => {
    try {
      await axios.delete(`http://localhost:8000/api/testimonials/${testimonialId}`);
      setTestimonials((prevTestimonials) =>
        prevTestimonials.filter((t) => t._id !== testimonialId)
      );
    } catch (err) {
      console.error(err);
      setError('Failed to delete testimonial. Please try again.');
    }
  };

  return (
    <div className="testimonials-container">
      <div className="bible-verse-scroll">
        <p 
          ref={verseRef}
          className="scrolling-verse"
          onAnimationEnd={handleScrollEnd}
        >
          {randomVerse}
        </p>
      </div>   
      <h2>Testimonials</h2>

      <form onSubmit={handlePostTestimonial} className="new-testimonial-form">
        <textarea
          value={newTestimonialContent}
          onChange={(e) => setNewTestimonialContent(e.target.value)}
          placeholder="Share your testimony..."
          className="new-testimonial-textarea"
        />
        <button type="submit" className="post-testimonial-button" disabled={!newTestimonialContent.trim() || isSubmitting}>
          Post Testimony
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {testimonials.map((testimonial) => (
        <div key={testimonial._id} className="testimonial-item">
          <div className="testimonial-header">
            <div className="author-info">
              <span className="author-name">{testimonial.user.name}</span>
              <span
                className="author-username"
                onClick={(e) => handleAuthorClick(e, testimonial.user.username)}
                style={{ cursor: 'pointer' }}
              >
                @{testimonial.user.username}
              </span>
            </div>
            {testimonial.user.id === loggedInUserId && (
              <div className="testimonial-actions" ref={dropdownRef}>
                <button
                  onClick={() => toggleDropdown(testimonial._id)}
                  className="action-button"
                >
                  <MoreVertical size={20} />
                </button>
                {activeDropdown === testimonial._id && (
                  <div className="dropdown">
                    <button onClick={() => setEditingTestimonial(testimonial)} className="dropdown-button">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(testimonial._id)} className="dropdown-button">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="testimonial-content">{testimonial.content}</p>
          <div className="testimonial-reactions">
            <button
              onClick={() => handleTestimonialReaction(testimonial._id, '👍')}
              className="reaction-button"
            >
              <ThumbsUp size={18} /> {testimonial.reactions?.length || 0}
            </button>
            <button
              onClick={() => handleTestimonialComment(testimonial._id, '')}
              className="comment-button"
            >
              <MessageCircle size={18} /> {testimonial.comments?.length || 0}
            </button>
          </div>
        </div>
      ))}

      {editingTestimonial && (
        <div className="edit-testimonial-modal">
          <textarea
            value={editingTestimonial.content}
            onChange={(e) =>
              setEditingTestimonial((prev) => ({ ...prev, content: e.target.value }))
            }
            className="edit-testimonial-textarea"
          />
          <div className="edit-testimonial-actions">
            <button
              onClick={() => handleUpdate(editingTestimonial._id, editingTestimonial.content)}
              className="update-button"
            >
              Update
            </button>
            <button
              onClick={() => setEditingTestimonial(null)}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Testimonials;