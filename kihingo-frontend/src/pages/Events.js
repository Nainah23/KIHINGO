// src/pages/Events.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../styles/Events.css";

const Events = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/events');
        setEvents(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div>
      <h2>Church Events</h2>
      {events.map(event => (
        <div key={event._id}>
          <h3>{event.title}</h3>
          <p>{event.description}</p>
          <p>Date: {new Date(event.date).toLocaleString()}</p>
          <p>Location: {event.location}</p>
          {event.imageUrl && <img src={event.imageUrl} alt={event.title} />}
        </div>
      ))}
    </div>
  );
};

export default Events;