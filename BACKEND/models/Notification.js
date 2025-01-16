// BACKEND/models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'appointment'],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'postModel',
    required: true
  },
  postModel: {
    type: String,
    required: true,
    enum: ['Feed', 'Appointment', 'Testimonial']
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