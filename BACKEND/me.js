// src/contexts/AuthContext.js;
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/api/auth/user', {
        headers: { 'x-auth-token': token }
      })
        .then(res => {
          setUser(res.data); // Set user data from response
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token); // Store the token
    setUser(userData); // Set the user data
  };

  const logout = () => {
    localStorage.removeItem('token'); // Remove the token
    setUser(null); // Clear user data
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


// src/pages/Home.js;
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FaHome, FaVideo, FaNewspaper, FaCalendar, FaBookOpen, FaDonate, FaComments } from 'react-icons/fa';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Add state for menu toggle

  const navItems = [
    { name: 'Home', icon: FaHome, path: '/' },
    { name: 'Live Stream', icon: FaVideo, path: '/livestream' },
    { name: 'Feed', icon: FaNewspaper, path: '/feed' },
    { name: 'Events', icon: FaCalendar, path: '/events' },
    { name: 'Book an Appointment', icon: FaBookOpen, path: '/appointments' },
    { name: 'Make a Donation', icon: FaDonate, path: '/donations' },
    { name: 'Testimonials', icon: FaComments, path: '/testimonials' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Function to render each nav link
  const NavLink = ({ item }) => {
    const requiresAuth = ['/feed', '/appointments'].includes(item.path);
    if (requiresAuth && !user) {
      return (
        <Link 
          to="/login" 
          state={{ from: item.path }} 
          className="flex items-center text-gray-600 hover:text-gray-800 transition duration-150 ease-in-out"
        >
          <item.icon className="mr-1" />
          {item.name}
        </Link>
      );
    }
    return (
      <Link 
        to={item.path} 
        className="flex items-center text-gray-600 hover:text-gray-800 transition duration-150 ease-in-out"
      >
        <item.icon className="mr-1" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-gray-800">ACK St. Philip's KIHINGO Church</div>
          <nav className="hidden lg:flex space-x-4">
            {navItems.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>
          {user ? (
            <div className="relative">
              <button 
                onClick={toggleMenu} 
                className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold"
              >
                {user.name.substring(0, 2).toUpperCase()}
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
                  <div className="py-1">
                    <p className="px-4 py-2 text-sm text-gray-700">Hello, {user.name}</p>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                    <button 
                      onClick={handleLogout} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-x-2">
              <Link to="/login" className="text-blue-500 hover:text-blue-600 transition duration-150 ease-in-out">Login</Link>
              <Link to="/register" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-150 ease-in-out">Sign Up</Link>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="bg-blue-600 text-white p-12 rounded-lg mb-8 relative overflow-hidden">
          <img src="/path/to/church-image.jpg" alt="Church" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" />
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">Welcome to ACK St. Philip's KIHINGO Church</h1>
            <p className="text-xl mb-6">Join us in worship and community</p>
            <div className="space-x-4">
              <Link to="/about" className="bg-white text-blue-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition duration-150 ease-in-out">Join Us Today</Link>
              <Link to="/donations" className="bg-yellow-500 text-blue-600 px-6 py-3 rounded-full font-bold hover:bg-yellow-400 transition duration-150 ease-in-out">Make a Donation</Link>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md transition duration-300 ease-in-out hover:shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Our Church</h2>
            <img src="/path/to/church-image.jpg" alt="Our Church" className="w-full h-48 object-cover rounded mb-4" />
            <Link to="/about" className="text-blue-500 hover:text-blue-600 transition duration-150 ease-in-out">Learn More</Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md transition duration-300 ease-in-out hover:shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Testimonials</h2>
            <p className="text-gray-600 mb-4">Read inspiring stories from our community members.</p>
            <Link to="/testimonials" className="text-blue-500 hover:text-blue-600 transition duration-150 ease-in-out">View All Testimonials</Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md transition duration-300 ease-in-out hover:shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
            <p className="text-gray-600 mb-4">Stay updated with our latest events and activities.</p>
            <Link to="/events" className="text-blue-500 hover:text-blue-600 transition duration-150 ease-in-out">View All Events</Link>
          </div>
        </section>

        <section className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="md:w-1/3">
            <div className="bg-green-500 text-white p-8 rounded-lg flex flex-col items-center justify-center text-center transition duration-300 ease-in-out hover:bg-green-600">
              <h2 className="text-3xl font-bold mb-2">Join Us Today</h2>
              <p className="mb-4">Come and be part of our loving community</p>
              <Link to="/contact" className="mt-4 bg-white text-green-500 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition duration-150 ease-in-out">Contact Us</Link>
            </div>
          </div>
          <div className="md:w-2/3 bg-white p-6 rounded-lg shadow-md transition duration-300 ease-in-out hover:shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <p className="mb-4 text-gray-600">Learn about how our church was born and the values that guide us every day.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;

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


// BACKEND/routes/authRoutes.js;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      role
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      config.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      config.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get User
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;