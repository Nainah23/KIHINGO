const mongoose = require('mongoose');

const ReactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true } // 'like', emoji, etc.
});

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  reactions: [ReactionSchema], // Support reactions on comments
  createdAt: { type: Date, default: Date.now }
});

const FeedSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  attachments: [{ type: String }], // URLs for media
  comments: [CommentSchema],
  reactions: [ReactionSchema], // Reactions (emoji, like)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feed', FeedSchema);
