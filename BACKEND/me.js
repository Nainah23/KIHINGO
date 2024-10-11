// BACKEND/routes/feedRoutes.js;
const express = require('express');
const router = express.Router();
const Feed = require('../models/Feed');
const authMiddleware = require('../middleware/authMiddleware');

// Create a feed post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const newFeed = new Feed({
      user: req.user.id,
      content,
      attachments
    });
    const feed = await newFeed.save();
    res.json(feed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all feed posts
router.get('/', async (req, res) => {
  try {
    const feeds = await Feed.find().sort({ createdAt: -1 }).populate('user', 'name');
    res.json(feeds);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a feed post
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const feed = await Feed.findById(req.params.id);

    if (!feed) {
      return res.status(404).json({ msg: 'Feed post not found' });
    }

    // Check user authorization
    if (feed.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Update the feed post
    feed.content = content;
    feed.attachments = attachments;

    await feed.save();

    res.json(feed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a feed post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) {
      return res.status(404).json({ msg: 'Feed post not found' });
    }
    // Check user authorization
    if (feed.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await feed.deleteOne();
    res.json({ msg: 'Feed post removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;


// BACKEND/models/Feed.js;
const mongoose = require('mongoose');

const FeedSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    type: String // URLs to images or other media
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Feed', FeedSchema);


// BACKEND/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const feedRoutes = require('./routes/feedRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const donationRoutes = require('./routes/donationRoutes');
const eventRoutes = require('./routes/eventRoutes');
const livestreamRoutes = require('./routes/livestreamRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
.then(() => console.log('Umegongewa MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/livestream', livestreamRoutes);
app.use('/api/notifications', notificationRoutes);

app.listen(config.PORT, () => console.log(`Server running on port ${config.PORT}`));

module.exports = app;

// src/components/PrivateRoute.js;
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    // You might want to render a loading spinner here
    return <div>Loading...</div>;
  }

  return user ? (
    <Component {...rest} />
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoute;


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
      axios.get('http://localhost:8000/api/auth/user', {
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

// src/pages/Feed.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../styles/Feed.css";

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

export default Feed;// BACKEND/routes/feedRoutes.js;
const express = require('express');
const router = express.Router();
const Feed = require('../models/Feed');
const authMiddleware = require('../middleware/authMiddleware');

// Create a feed post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const newFeed = new Feed({
      user: req.user.id,
      content,
      attachments
    });
    const feed = await newFeed.save();
    res.json(feed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all feed posts
router.get('/', async (req, res) => {
  try {
    const feeds = await Feed.find().sort({ createdAt: -1 }).populate('user', 'name');
    res.json(feeds);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a feed post
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const feed = await Feed.findById(req.params.id);

    if (!feed) {
      return res.status(404).json({ msg: 'Feed post not found' });
    }

    // Check user authorization
    if (feed.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Update the feed post
    feed.content = content;
    feed.attachments = attachments;

    await feed.save();

    res.json(feed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a feed post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) {
      return res.status(404).json({ msg: 'Feed post not found' });
    }
    // Check user authorization
    if (feed.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await feed.deleteOne();
    res.json({ msg: 'Feed post removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;


// BACKEND/models/Feed.js;
const mongoose = require('mongoose');

const FeedSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    type: String // URLs to images or other media
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Feed', FeedSchema);


// BACKEND/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const feedRoutes = require('./routes/feedRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const donationRoutes = require('./routes/donationRoutes');
const eventRoutes = require('./routes/eventRoutes');
const livestreamRoutes = require('./routes/livestreamRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
.then(() => console.log('Umegongewa MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/livestream', livestreamRoutes);
app.use('/api/notifications', notificationRoutes);

app.listen(config.PORT, () => console.log(`Server running on port ${config.PORT}`));

module.exports = app;

// src/components/PrivateRoute.js;
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    // You might want to render a loading spinner here
    return <div>Loading...</div>;
  }

  return user ? (
    <Component {...rest} />
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoute;


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
      axios.get('http://localhost:8000/api/auth/user', {
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

// src/pages/Feed.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../styles/Feed.css";

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


/* src/styles/Feed.css */
@import './common.css';

.feed-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.feed-item {
    width: 90%;
    max-width: 600px;
    margin: 10px 0;
}

.feed-item p {
    color: #444;
}

@media (max-width: 768px) {
    .feed-item p {
        font-size: 0.9em;
    }
}

