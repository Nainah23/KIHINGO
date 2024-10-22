import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [userProfile, setUserProfile] = useState({});
  const { user } = useContext(AuthContext);
  const [randomVerse, setRandomVerse] = useState('');
  const [displayWelcomeMessage, setDisplayWelcomeMessage] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrollCount, setScrollCount] = useState(0);
  const [bibleVerses, setBibleVerses] = useState([]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/default-profile.png';
    const cleanPath = imagePath.replace(/^uploads\//, '');
    return `http://localhost:8000/uploads/${cleanPath}`;
  };

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

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/appointments', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (!res.ok) throw new Error('Failed to fetch appointments');
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setAppointments([]);
    }
  }, []);

  // Function to load Bible verses from the verses.txt file
  const loadBibleVerses = async () => {
    try {
      const res = await fetch('/verses.txt');
      const text = await res.text();
      const versesArray = text.split('\n').filter(verse => verse.trim() !== '');
      setBibleVerses(versesArray);
    } catch (error) {
      console.error('Error loading verses:', error);
    }
  };

  // Function to handle verse scrolling logic
  const handleVerseScroll = () => {
    if (scrollCount < 2) {
      setScrollCount(scrollCount + 1);
    } else {
      setScrollCount(0);
      const randomIndex = Math.floor(Math.random() * bibleVerses.length);
      setRandomVerse(bibleVerses[randomIndex]);
    }
  };

  useEffect(() => {
    loadBibleVerses();
    fetchAppointments();
    fetchUserProfile();

    if (bibleVerses.length > 0) {
      const randomIndex = Math.floor(Math.random() * bibleVerses.length);
      setRandomVerse(bibleVerses[randomIndex]);
    }

    if ((userProfile.name || user?.username) && !isAnimating) {
      setIsAnimating(true);
      const firstName = userProfile.name?.split(' ')[0] || user?.username || 'Friend';
      const message = `🌟 Warm Greetings, ${firstName}! Ready to book an appointment with the Reverend? Let's make it happen! 🌟`;

      setDisplayWelcomeMessage('');

      const animateMessage = async () => {
        for (let i = 0; i <= message.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setDisplayWelcomeMessage(message.slice(0, i));
        }
        setIsAnimating(false); // Animation runs only once
      };

      animateMessage();
    }

    // Set an interval to scroll verses every few seconds
    const interval = setInterval(handleVerseScroll, 3000); // Change verse every 3 seconds
    return () => clearInterval(interval); // Cleanup on component unmount
  }, [fetchUserProfile, fetchAppointments, userProfile.name, user?.username, isAnimating, bibleVerses, scrollCount]);

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ reason, date })
      });

      if (!res.ok) throw new Error('Failed to book appointment');

      await fetchAppointments();
      setReason('');
      setDate('');
      setIsFormVisible(false);
    } catch (err) {
      console.error('Error booking appointment:', err);
    }
  };

  return (
    <div className="appointments-container">
      <div className="bible-verse-scroll">
        <p>{randomVerse}</p>
      </div>

      <div className="grid-container">
        <div className="profile-section">
          <img
            src={getImageUrl(userProfile.profileImage)}
            alt="User Profile"
            className="profile-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-profile.png';
            }}
          />
          <h3>User Profile</h3>
          <p>Username: {userProfile.username || user?.username || 'Not set'}</p>
          <p>Name: {userProfile.name || 'Not set'}</p>
        </div>

        <div className="appointments-section">
          <h3 className="welcome-message">{displayWelcomeMessage}</h3>

          <h2>My Appointments</h2>
          {appointments.map((appointment, index) => (
            <div key={appointment._id || index} className="appointment-card">
              <p><strong>Appointment {index + 1}</strong></p>
              <p>With: REVEREND</p>
              <p>Reason: {appointment.reason}</p>
              <p>Date: {new Date(appointment.date).toLocaleString()}</p>
              <p>Status: {appointment.status}</p>
            </div>
          ))}

          <button
            className="book-appointment-button"
            onClick={() => setIsFormVisible(!isFormVisible)}
          >
            Book an Appointment with Reverend
          </button>

          {isFormVisible && (
            <form className="appointment-form" onSubmit={handleBooking}>
              <input
                type="text"
                placeholder="Reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <button type="submit">Book</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
