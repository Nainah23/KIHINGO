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
  }, [
    fetchUserProfile,
    fetchRandomBibleVerse,
    userProfile.name,
    user?.username,
    isAnimating
  ]);

  const handleDonation = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/donations/initiate', { amount, phoneNumber });
      // Handle the response from MPESA STK Push
      console.log(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white p-6">
      {/* Bible Verse Scroll */}
      <div className="text-center mb-8 bg-white bg-opacity-40 p-4 rounded-lg shadow-lg">
        <p
          ref={verseRef}
          className="scrolling-verse text-2xl font-serif font-semibold"
          onAnimationEnd={handleScrollEnd}
        >
          {randomVerse}
        </p>
      </div>

      {/* Welcome Message */}
      <div className="text-center mb-12">
        <h3 className="text-3xl font-semibold text-yellow-300">
          {displayWelcomeMessage}
        </h3>
      </div>

      {/* Donation Form */}
      <div className="max-w-lg mx-auto bg-white bg-opacity-70 p-8 rounded-lg shadow-xl backdrop-blur-md">
        <form onSubmit={handleDonation}>
          <div className="mb-6">
            <label htmlFor="amount" className="block text-gray-800 font-medium text-xl mb-2">Donation Amount</label>
            <input
              type="number"
              id="amount"
              className="w-full p-4 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-xl"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="phoneNumber" className="block text-gray-800 font-medium text-xl mb-2">Phone Number (MPESA)</label>
            <input
              type="tel"
              id="phoneNumber"
              className="w-full p-4 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-xl"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full p-4 mt-4 bg-blue-600 text-white text-xl font-semibold rounded-lg hover:bg-blue-700 focus:outline-none transform transition duration-300"
          >
            Donate Now
          </button>
        </form>
      </div>

      {/* Footer Section */}
      <div className="text-center mt-12">
        <p className="text-sm text-white font-light">
          By donating, you're helping us build a brighter future. Thank you for your support!
        </p>
      </div>
    </div>
  );
};

export default Donations;