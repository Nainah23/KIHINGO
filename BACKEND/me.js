import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/Appointments.css';

const ReverendAppointments = () => {
  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [randomVerse, setRandomVerse] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollCount = useRef(0);
  const verseRef = useRef(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments/reverend', {
        headers: { 
          'x-auth-token': localStorage.getItem('token'),
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch appointments: ${errorText}`);
      }
      
      const data = await res.json();
      const now = new Date();
      const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setAppointments({
        upcoming: sorted.filter(apt => new Date(apt.date) >= now),
        past: sorted.filter(apt => new Date(apt.date) < now)
      });
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  }, []);

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) throw new Error('Failed to update appointment');
      fetchAppointments();
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };

  // Bible verse handlers remain the same...
  const fetchRandomBibleVerse = useCallback(async () => {
    try {
      const res = await fetch('/api/bible-verse');
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
    fetchAppointments();
    fetchRandomBibleVerse();
  }, [fetchAppointments, fetchRandomBibleVerse]);

  return (
    <div className="appointments-container">
      <div className="bible-verse-scroll">
        <p ref={verseRef} className="scrolling-verse" onAnimationEnd={handleScrollEnd}>
          {randomVerse}
        </p>
      </div>

      <div className="appointments-section">
        <h2>Upcoming Appointments</h2>
        {appointments.upcoming.map((appointment) => (
          <div key={appointment._id} className="appointment-card">
            <h3>Appointment with {appointment.user?.name || 'Unknown User'}</h3>
            <p>Date: {new Date(appointment.date).toLocaleString()}</p>
            <p>Reason: {appointment.reason}</p>
            <p>Status: {appointment.status}</p>
            {appointment.status === 'pending' && (
              <div className="appointment-actions">
                <button 
                  onClick={() => updateAppointmentStatus(appointment._id, 'approved')}
                  className="approve-btn"
                >
                  Approve
                </button>
                <button 
                  onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                  className="reschedule-btn"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}

        <h2>Past Appointments</h2>
        {appointments.past.map((appointment) => (
          <div key={appointment._id} className="appointment-card past">
            <h3>Appointment with {appointment.user?.name || 'Unknown User'}</h3>
            <p>Date: {new Date(appointment.date).toLocaleString()}</p>
            <p>Reason: {appointment.reason}</p>
            <p>Status: {appointment.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReverendAppointments;