import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { MoreVertical } from 'lucide-react';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userTestimonials, setUserTestimonials] = useState([]);
  const [bibleVerse, setBibleVerse] = useState('');
  const verseRef = useRef(null);
  const scrollCount = useRef(0);

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
    fetchUserTestimonials();
    fetchBibleVerse();
  }, [username]);

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

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/auth/profile/${username}`);
      setUser(res.data);
    } catch (err) {
      console.error(err);
      navigate('/feed');
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/feed/user/${username}`);
      setUserPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserTestimonials = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/testimonials/user/${username}`);
      setUserTestimonials(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/feed/${postId}`);
  };

  const handleTestimonialClick = (testimonialId) => {
    navigate(`/testimonials/${testimonialId}`);
  };

  if (!user) return <div>Loading...</div>;

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

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center space-x-4">
            <img
              src={user.profileImage || '/default-profile.png'}
              alt={user.name}
              className="w-24 h-24 rounded-full border-4 border-blue-200"
            />
            <div>
              <h2 className="text-2xl font-bold text-blue-800">{user.name}</h2>
              <p className="text-gray-600">@{user.username}</p>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-gray-600 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-bold text-blue-800 mb-4">Posts</h3>
            {userPosts.map(post => (
              <div
                key={post._id}
                className="bg-white rounded-2xl shadow-xl p-6 mb-4 transform transition-all duration-300 ease-out hover:scale-[1.02] cursor-pointer"
                onClick={() => handlePostClick(post._id)}
              >
                <p className="text-gray-800">{post.content}</p>
                <div className="flex items-center mt-4 space-x-4">
                  <span className="text-gray-600">👍 {post.reactions.length}</span>
                  <span className="text-gray-600">💬 {post.comments.length}</span>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-xl font-bold text-blue-800 mb-4">Testimonials</h3>
            {userTestimonials.map(testimonial => (
              <div
                key={testimonial._id}
                className="bg-white rounded-2xl shadow-xl p-6 mb-4 transform transition-all duration-300 ease-out hover:scale-[1.02] cursor-pointer"
                onClick={() => handleTestimonialClick(testimonial._id)}
              >
                <p className="text-gray-800">{testimonial.content}</p>
                <div className="flex items-center mt-4 space-x-4">
                  <span className="text-gray-600">👍 {testimonial.reactions.length}</span>
                  <span className="text-gray-600">💬 {testimonial.comments.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;