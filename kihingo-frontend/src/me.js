import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const Donations = () => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [randomVerse, setRandomVerse] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollCount = useRef(0);
  const verseRef = useRef(null);
  const [displayWelcomeMessage, setDisplayWelcomeMessage] = useState('');
  
  // Fetching random Bible verse
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

    if (!isAnimating) {
      setIsAnimating(true);
      const message = `🌟 Welcome, friend! Thank you for visiting ACK St Phillips Kihingo's Donation Page. Your generous support helps us continue our mission of faith and community. Would you like to make a donation today and make a difference? 🌟`;
      setDisplayWelcomeMessage('');

      const animateMessage = async () => {
        for (let i = 0; i <= message.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setDisplayWelcomeMessage(message.slice(0, i));
        }
        setIsAnimating(false);
      };

      animateMessage();
    }
  }, [fetchRandomBibleVerse, isAnimating]);

  const handleDonation = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/donations/initiate', { amount, phoneNumber });
      console.log(res.data); // Handle MPESA STK Push response
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Bible Verse Scroll */}
      <div className="bible-verse-scroll">
        <p 
          ref={verseRef}
          className="scrolling-verse text-xl text-gray-700 font-serif"
          onAnimationEnd={handleScrollEnd}
        >
          {randomVerse}
        </p>
      </div>

      {/* Welcome Message */}
      <div className="welcome-message-section text-center mb-8">
        <h3 className="text-2xl font-semibold text-blue-600">{displayWelcomeMessage}</h3>
      </div>

      {/* Donation Form */}
      <div className="donation-form bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleDonation}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 font-medium">Donation Amount</label>
            <input
              type="number"
              id="amount"
              className="w-full p-2 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              className="w-full p-2 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full p-3 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
          >
            Donate Now
          </button>
        </form>
      </div>
    </div>
  );
};

export default Donations;