const mongoose = require('mongoose');

const repositoryListingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoUrl: { type: String, required: true, trim: true },
  repoName: { type: String, trim: true },
  description: { type: String, trim: true },
  userPrice: { type: Number, required: true, min: 0 },
  aiEstimatedPrice: { type: Number, min: 0 },
  aiRating: { type: Number, min: 1, max: 10 },
  aiAnalysisReasoning: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['ACTIVE', 'SOLD', 'REMOVED'], default: 'ACTIVE' },
}, { timestamps: true });

module.exports = mongoose.model('RepositoryListing', repositoryListingSchema);
