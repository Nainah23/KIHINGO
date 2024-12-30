import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

const Donations = () => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [randomVerse, setRandomVerse] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollCount = useRef(0);
  const verseRef = useRef(null);
  const { user } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState({});
  const [displayWelcomeMessage, setDisplayWelcomeMessage] = useState('');

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/auth/profile/${user?.username}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setUserProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setUserProfile({});
    }
  }, [user?.username]);

  const fetchRandomBibleVerse = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/bible-verse');
      if (!res.ok) throw new Error('Failed to fetch Bible verse');
      const data = await res.json();
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
      fetchRandomBibleVerse();
    }
  };

  useEffect(() => {
    fetchRandomBibleVerse();
    fetchUserProfile();

    if ((userProfile.name || user?.username) && !isAnimating) {
      setIsAnimating(true);
      const firstName = userProfile.name?.split(' ')[0] || user?.username || 'Friend';
      const message = `🌟 Welcome, ${firstName}! Thank you for visiting ACK St Phillips Kihingo's Donation Page. Your generous support helps us continue our mission of faith and community. Would you like to make a donation today and make a difference? 🌟`;
      setDisplayWelcomeMessage(message);

      const animateMessage = async () => {
        for (let i = 0; i <= message.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setDisplayWelcomeMessage(message.slice(0, i));
        }
        setIsAnimating(false);
      };

      animateMessage();
    }
  }, [fetchUserProfile, fetchRandomBibleVerse, userProfile.name, user?.username, isAnimating]);

  const handleDonation = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/donations/initiate', { amount, phoneNumber });
      console.log(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
      {/* Bible Verse Scroll */}
      <div className="bible-verse-scroll mb-6">
        <p
          ref={verseRef}
          className="scrolling-verse text-lg text-gray-600 font-serif"
          onAnimationEnd={handleScrollEnd}
        >
          {randomVerse}
        </p>
      </div>

      {/* Welcome Message */}
      <div className="welcome-message-section text-center mb-8">
        <h3 
          className="text-2xl font-semibold text-transparent bg-clip-text 
                    bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 
                    animate-gradient-text"
        >
          {displayWelcomeMessage}
        </h3>
      </div>

      {/* Donation Form */}
      <div className="donation-form bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
        <form onSubmit={handleDonation}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 font-medium">Donation Amount</label>
            <input
              type="number"
              id="amount"
              className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-gray-700 font-medium">Phone Number (MPESA)</label>
            <input
              type="tel"
              id="phoneNumber"
              className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full p-3 mt-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none"
          >
            Donate Now
          </button>
        </form>
      </div>

      {/* Footer Section */}
      <div className="text-center mt-12">
        <p className="text-sm text-black font-light">
          By donating, you're helping us build a brighter future. Thank you for your support!
        </p>
      </div>
    </div>
  );
};

export default Donations;