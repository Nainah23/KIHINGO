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
    required: true, // URL to the YouTube livestream
  },
  youtubeBroadcastId: {
    type: String, // Store YouTube livestream ID (useful for fetching or updating streams)
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Livestream', LivestreamSchema);
