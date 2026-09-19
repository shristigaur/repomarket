const mongoose = require('mongoose');

const aiReportSchema = new mongoose.Schema(
  {
    codeHealthScore: { type: Number, min: 1, max: 100 },
    estimatedValuation: { type: String },
    launchReadiness: { type: String },
    techStackDetails: {
      frameworks: [{ type: String }],
      database: [{ type: String }],
      runtime: { type: String }
    },
    projectCompleteness: {
      completedFeatures: [{ type: String }],
      hasTests: { type: Boolean },
      hasDeploymentConfig: { type: Boolean },
      documentationRating: { type: String, enum: ['High', 'Medium', 'Low'] }
    },
    dependencyAudit: {
      totalDependencies: { type: Number, min: 0 },
      deprecatedOrOutdated: [{ type: String }],
      paidApiIntegrations: [{ type: String }]
    },
    riskAndSecurity: {
      licenseType: { type: String },
      hasEnvExample: { type: Boolean },
      riskFlags: [{ type: String }]
    }
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  repoUrl: { type: String, required: true, trim: true },
  repoName: { type: String, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  marketRate: { type: Number, required: true, min: 0 },
  sellerEmail: { type: String, trim: true },
  aiReport: { type: aiReportSchema },
  status: { type: String, enum: ['ACTIVE', 'SOLD', 'WITHDRAWN'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Listing', listingSchema);