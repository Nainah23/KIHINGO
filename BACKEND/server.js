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


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
.then(() => console.log('Umegongewa MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

const bibleVerses = [
    { verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future. - Jeremiah 29:11" },
    { verse: "I can do all things through Christ who strengthens me. - Philippians 4:13" },
    { verse: "The Lord is my shepherd; I shall not want. - Psalm 23:1" },
    { verse: "Trust in the Lord with all your heart and lean not on your own understanding. - Proverbs 3:5" },
    { verse: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose. - Romans 8:28" },
    { verse: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint. - Isaiah 40:31" },
    { verse: "The Lord is close to the brokenhearted and saves those who are crushed in spirit. - Psalm 34:18" },
    { verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. - Philippians 4:6" }
];




  const getRandomBibleVerse = () => {
    const randomIndex = Math.floor(Math.random() * bibleVerses.length);
    return bibleVerses[randomIndex];
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