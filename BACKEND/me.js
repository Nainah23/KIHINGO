// src/pages/Appointments.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../styles/Appointments.css";
import "../styles/common.css";

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


// BACKEND/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Book an appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { reason, date } = req.body;
    
    // Find the reverend
    const reverend = await User.findOne({ role: 'reverend' });
    if (!reverend) {
      return res.status(404).json({ msg: 'No reverend found in the system' });
    }

    const newAppointment = new Appointment({
      user: req.user.id,
      appointmentWith: reverend._id,
      reason,
      date
    });

    const appointment = await newAppointment.save();
    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all appointments for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id }).sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all appointments for the reverend
router.get('/reverend', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'reverend') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    const appointments = await Appointment.find({ appointmentWith: req.user.id }).sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update appointment status (for reverend only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Check if user is the reverend
    if (req.user.role !== 'reverend') {
      return res.status(403).json({ msg: 'Not authorized to update appointment status' });
    }

    appointment.status = status;
    await appointment.save();

    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete an appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Check if user owns the appointment or is the reverend
    if (appointment.user.toString() !== req.user.id && req.user.role !== 'reverend') {
      return res.status(403).json({ msg: 'Not authorized to delete this appointment' });
    }

    await appointment.deleteOne();
    res.json({ msg: 'Appointment removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

// BACKEND/models/Appointment.js;
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentWith: {
    type: String,
    enum: ['reverend', 'evangelist'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  date: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);


/* src/styles/Appointments.css */
div {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  margin: 10px 0;
  background-color: #f9f9f9;
}

h2 {
  color: #333;
}

p {
  font-size: 14px;
  line-height: 1.5;
}

// BACKEND/models/Notification.js;
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment'],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);


// BACKEND/routes/notificationRoutes.js;
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Feed = require('../models/Feed'); // Add this
const User = require('../models/User'); // Add this
const authMiddleware = require('../middleware/authMiddleware');

// Get all notifications for a user with population
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('creator', 'name username profileImage')
      .populate('post', 'content')
      .sort({ createdAt: -1 });

    const formattedNotifications = notifications.map(notification => {
      let content = '';
      if (notification.type === 'like') {
        content = `${notification.creator.name} liked your post: "${notification.post.content.substring(0, 50)}${notification.post.content.length > 50 ? '...' : ''}"`;
      } else if (notification.type === 'comment') {
        content = `${notification.creator.name} commented on your post: "${notification.post.content.substring(0, 50)}${notification.post.content.length > 50 ? '...' : ''}"`;
      }

      return {
        _id: notification._id,
        content,
        creator: notification.creator,
        type: notification.type,
        post: notification.post._id,
        read: notification.read,
        createdAt: notification.createdAt
      };
    });

    res.json(formattedNotifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a notification
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { userId, type, postId } = req.body;

    // Verify post exists
    const post = await Feed.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Don't create notification if user is acting on their own post
    if (post.user.toString() === req.user.id) {
      return res.status(200).json({ msg: 'No notification needed for own post' });
    }

    // Create notification
    const notification = new Notification({
      user: userId,
      type,
      post: postId,
      creator: req.user.id
    });

    await notification.save();

    // Populate the notification with user and post details
    const populatedNotification = await Notification.findById(notification._id)
      .populate('creator', 'name username profileImage')
      .populate('post', 'content');

    // Format the notification content
    let content = '';
    if (type === 'like') {
      content = `${populatedNotification.creator.name} liked your post: "${populatedNotification.post.content.substring(0, 50)}${populatedNotification.post.content.length > 50 ? '...' : ''}"`;
    } else if (type === 'comment') {
      content = `${populatedNotification.creator.name} commented on your post: "${populatedNotification.post.content.substring(0, 50)}${populatedNotification.post.content.length > 50 ? '...' : ''}"`;
    }

    const formattedNotification = {
      _id: notification._id,
      content,
      creator: populatedNotification.creator,
      type: notification.type,
      post: notification.post,
      read: notification.read,
      createdAt: notification.createdAt
    };

    res.json(formattedNotification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Mark a notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('creator', 'name username profileImage')
      .populate('post', 'content');

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Check if the notification belongs to the user
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    notification.read = true;
    await notification.save();

    // Format the notification content
    let content = '';
    if (notification.type === 'like') {
      content = `${notification.creator.name} liked your post: "${notification.post.content.substring(0, 50)}${notification.post.content.length > 50 ? '...' : ''}"`;
    } else if (notification.type === 'comment') {
      content = `${notification.creator.name} commented on your post: "${notification.post.content.substring(0, 50)}${notification.post.content.length > 50 ? '...' : ''}"`;
    }

    const formattedNotification = {
      _id: notification._id,
      content,
      creator: notification.creator,
      type: notification.type,
      post: notification.post._id,
      read: notification.read,
      createdAt: notification.createdAt
    };

    res.json(formattedNotification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Check if the notification belongs to the user
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await notification.deleteOne(); // Updated from remove() to deleteOne()

    res.json({ msg: 'Notification removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get unread notification count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;