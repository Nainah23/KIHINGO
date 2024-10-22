// BACKEND/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Register User
router.post('/register', upload.single('profileImage'), async (req, res) => {
  try {
    const { username, name, email, password, role, contact } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      username,
      name,
      email,
      password,
      role,
      contact,
      profileImage: req.file ? req.file.path : null
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
    const { username, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Prepare payload for JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign the token and return user data + token
    jwt.sign(
      payload,
      config.JWT_SECRET,
      { expiresIn: 3600 }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;

        console.log('User Registered ', user);

        // Send response with token and user data
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            contact: user.contact
          }
          });
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

router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email -contact');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    console.log(err, 'error from profile');
    res.status(500).send('Server Error');
  }
});

module.exports = router;