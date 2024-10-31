// BACKEND/models/Livestream.js
const mongoose = require('mongoose');

const LivestreamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  streamUrl: {
    type: String,
    required: true,
  },
  youtubeBroadcastId: {
    type: String,
    required: true
  },
  streamKey: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'streaming', 'ended', 'error'],
    default: 'created'
  },
  streamingDetails: {
    rtmpUrl: String,
    streamKey: String,
    error: String
  }
}, {
  timestamps: true  // This replaces the manual createdAt and adds updatedAt
});

module.exports = mongoose.model('Livestream', LivestreamSchema);