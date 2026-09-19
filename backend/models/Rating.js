const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now }
});

ratingSchema.index({ listingId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
