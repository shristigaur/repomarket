const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  repoUrl: { type: String, required: true },
  repoName: { type: String },
  description: { type: String },
  userPrice: { type: Number, required: true },
  aiEstimatedPrice: { type: Number },
  aiRating: { type: Number },
  aiAnalysis: {
    type: Object,
    default: {}
  },
  status: { type: String, enum: ['active', 'sold', 'removed'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Listing', ListingSchema);