// src/pages/Testimonials.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/testimonials');
        setTestimonials(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <div>
      <h2>Testimonials</h2>
      {testimonials.map(testimonial => (
        <div key={testimonial._id}>
          <p>{testimonial.content}</p>
          <p>Posted by: {testimonial.user.name}</p>
          {/* Add reaction and comment functionality */}
        </div>
      ))}
    </div>
  );
};

export default Testimonials;
// src/pages/Testimonials.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/testimonials');
        setTestimonials(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <div>
      <h2>Testimonials</h2>
      {testimonials.map(testimonial => (
        <div key={testimonial._id}>
          <p>{testimonial.content}</p>
          <p>Posted by: {testimonial.user.name}</p>
          {/* Add reaction and comment functionality */}
        </div>
      ))}
    </div>
  );
};

export default Testimonials;


// src/pages/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Use useNavigate instead of useHistory

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const navigate = useNavigate(); // Use useNavigate instead of useHistory

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/auth/register', { name, email, password, role });
      navigate('/login'); // Use navigate instead of history.push
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <input
            type='role'
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role"
            required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;


// src/pages/Login.js;
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', { email, password });

      // Call login method from context with user data
      login(response.data.user, response.data.token); // Pass user data and token
      
      // Redirect to the previous page or home if no previous page
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;


// src/pages/Livestream.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Livestream = () => {
  const [livestreams, setLivestreams] = useState([]);

  useEffect(() => {
    const fetchLivestreams = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/livestream');
        setLivestreams(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLivestreams();
  }, []);

  return (
    <div>
      <h2>Church Livestreams</h2>
      {livestreams.map(stream => (
        <div key={stream._id}>
          <h3>{stream.title}</h3>
          <p>{stream.description}</p>
          <p>Start Time: {new Date(stream.startTime).toLocaleString()}</p>
          <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${stream.youtubeBroadcastId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ))}
    </div>
  );
};

export default Livestream;// src/pages/Livestream.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Livestream = () => {
  const [livestreams, setLivestreams] = useState([]);

  useEffect(() => {
    const fetchLivestreams = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/livestream');
        setLivestreams(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLivestreams();
  }, []);

  return (
    <div>
      <h2>Church Livestreams</h2>
      {livestreams.map(stream => (
        <div key={stream._id}>
          <h3>{stream.title}</h3>
          <p>{stream.description}</p>
          <p>Start Time: {new Date(stream.startTime).toLocaleString()}</p>
          <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${stream.youtubeBroadcastId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ))}
    </div>
  );
};

export default Livestream;


// src/pages/Feed.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Feed = () => {
  const [feeds, setFeeds] = useState([]);

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/feed');
        setFeeds(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFeeds();
  }, []);

  return (
    <div>
      <h2>Church Feed</h2>
      {feeds.map(feed => (
        <div key={feed._id}>
          <p>{feed.content}</p>
          <p>Posted by: {feed.user.name}</p>
        </div>
      ))}
    </div>
  );
};

export default Feed;


// src/pages/Events.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

export default Events;// src/pages/Events.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

// src/pages/Donations.js
import React, { useState } from 'react';
import axios from 'axios';

const Donations = () => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

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
    <div>
      <h2>Make a Donation</h2>
      <form onSubmit={handleDonation}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          required
        />
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Phone Number"
          required
        />
        <button type="submit">Donate</button>
      </form>
    </div>
  );
};

export default Donations;


// src/pages/Appointments.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/appointments');
        setAppointments(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div>
      <h2>Appointments</h2>
      {appointments.map(appointment => (
        <div key={appointment._id}>
          <p>With: {appointment.appointmentWith}</p>
          <p>Reason: {appointment.reason}</p>
          <p>Date: {new Date(appointment.date).toLocaleString()}</p>
          <p>Status: {appointment.status}</p>
        </div>
      ))}
      {/* Add appointment booking form */}
    </div>
  );
};

export default Appointments;
