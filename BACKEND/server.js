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
const path = require('path');
const fs = require('fs'); // Import the fs module

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('Umegongewa MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Read the verses from the verses.txt file
const loadBibleVerses = () => {
  const filePath = path.join(__dirname, 'verses.txt');
  const data = fs.readFileSync(filePath, 'utf-8'); // Read the file synchronously
  return data.split('\n').filter(verse => verse.trim() !== ''); // Split into lines and filter empty lines
};

const bibleVerses = loadBibleVerses(); // Load the verses at startup

const getRandomBibleVerse = () => {
  const randomIndex = Math.floor(Math.random() * bibleVerses.length);
  return { verse: bibleVerses[randomIndex] }; // Return the verse in the expected format
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint to get a random Bible verse
app.get('/api/bible-verse', (req, res) => {
  const randomVerse = getRandomBibleVerse();
  res.json(randomVerse);
});

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
