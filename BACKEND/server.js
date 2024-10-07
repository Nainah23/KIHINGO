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