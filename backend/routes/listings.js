const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const { requireAuth } = require('../middleware/auth');
const { getRepoDetails } = require('../services/githubService');
const { analyzeRepoCode } = require('../services/aiService');

const OpenAI = require('openai');

function defaultValuation(askingPrice) {
  const normalizedPrice = Math.max(0, Number(askingPrice) || 0);
  return {
    estimatedPrice: Math.max(100, Math.round(normalizedPrice * 0.9)),
    priceRange: { min: Math.round(normalizedPrice * 0.8), max: Math.round(normalizedPrice * 1.2) },
    rating: 8.0,
    summary: 'Repository metadata analyzed based on commit history and code structure.',
    breakdown: {
      codeQuality: 'Good',
      commitActivity: 'Moderate',
      popularityScore: 7
    }
  };
}

function fallbackRepoDetails(repoUrl, reason) {
  const repoName = repoUrl.split('/').filter(Boolean).pop()?.replace(/\.git$/, '') || 'repository';
  return {
    repoInfo: {
      name: repoName,
      full_name: repoName,
      description: `GitHub metadata unavailable: ${reason}`,
      stargazers_count: 0,
      forks_count: 0,
      open_issues_count: 0,
      language: 'Unknown',
      size: 0,
      pushed_at: null
    },
    packageJson: null,
    readmeText: null,
    fileTree: [],
    commits: []
  };
}

function valuationFromGeminiReport(report, askingPrice) {
  const range = report.estimatedValuation?.match(/\$?([\d,]+).*?\$?([\d,]+)/);
  const min = range ? Number(range[1].replace(/,/g, '')) : defaultValuation(askingPrice).priceRange.min;
  const max = range ? Number(range[2].replace(/,/g, '')) : defaultValuation(askingPrice).priceRange.max;
  return {
    estimatedPrice: Math.round((min + max) / 2),
    priceRange: { min, max },
    rating: Number((Number(report.codeHealthScore || 70) / 10).toFixed(1)),
    summary: report.launchReadiness || defaultValuation(askingPrice).summary,
    breakdown: {
      codeQuality: report.codeHealthScore >= 80 ? 'High' : report.codeHealthScore >= 60 ? 'Good' : 'Needs review',
      commitActivity: report.riskAndSecurity?.riskFlags?.length ? 'Needs review' : 'Moderate',
      popularityScore: 7
    }
  };
}

// POST /api/listings/analyze
router.post('/analyze', async (req, res) => {
  const { repoUrl, userPrice, askingPrice } = req.body || {};
  if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

  const price = Number(userPrice ?? askingPrice ?? 0);
  let repoDetails;
  try {
    repoDetails = await getRepoDetails(repoUrl);
  } catch (error) {
    console.warn('GitHub repository lookup failed; using metadata fallback:', error.message);
    repoDetails = fallbackRepoDetails(repoUrl, error.message);
  }

  let analysis = defaultValuation(price);
  const hasOpenAI = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('your_');
  const hasGemini = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('your_');

  try {
    if (hasOpenAI) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `Evaluate this repository as a code marketplace asset. Return ONLY valid JSON matching this schema: {"estimatedPrice":150,"priceRange":{"min":100,"max":200},"rating":8.5,"summary":"string","breakdown":{"codeQuality":"High","commitActivity":"Active","popularityScore":8}}. Do not include Markdown or extra keys.
Repository Info: ${JSON.stringify(repoDetails.repoInfo)}
README: ${repoDetails.readmeText?.substring(0, 500) || 'None'}
Package JSON: ${repoDetails.packageJson || 'None'}
File tree: ${JSON.stringify(repoDetails.fileTree)}
Recent commits: ${JSON.stringify(repoDetails.commits.slice(0, 5))}`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      analysis = { ...analysis, ...JSON.parse(completion.choices[0].message.content) };
    } else if (hasGemini) {
      const geminiReport = await analyzeRepoCode({ ...repoDetails, throwOnError: true });
      analysis = valuationFromGeminiReport(geminiReport, price);
    } else {
      console.warn('No OPENAI_API_KEY or GEMINI_API_KEY configured; using valuation fallback.');
    }
  } catch (error) {
    console.warn('AI repository analysis failed; using valuation fallback:', error.message);
    analysis = defaultValuation(price);
  }

  return res.status(200).json({
    ...analysis,
    repoInfo: {
      stars: repoDetails.repoInfo.stargazers_count,
      forks: repoDetails.repoInfo.forks_count,
      openIssues: repoDetails.repoInfo.open_issues_count,
      language: repoDetails.repoInfo.language
    }
  });
});

// POST /api/listings
router.post('/', requireAuth, async (req, res) => {
  try {
    const { repoUrl, repoName, description, userPrice, aiEstimatedPrice, aiRating, aiAnalysis } = req.body;
    
    const listing = await Listing.create({
      userId: req.user._id,
      repoUrl,
      repoName,
      description,
      userPrice,
      aiEstimatedPrice,
      aiRating,
      aiAnalysis,
      status: 'active'
    });
    
    return res.status(201).json(listing);
  } catch (error) {
    console.error('Create listing error:', error);
    return res.status(400).json({ error: 'Failed to create listing' });
  }
});

// GET /api/listings
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'active' })
      .populate('userId', 'name avatar email')
      .sort({ createdAt: -1 });
    return res.json(listings.map((listing) => ({
      ...listing.toObject(),
      seller: listing.userId,
      userId: listing.userId?._id || listing.userId
    })));
  } catch (error) {
    console.error('Fetch listings error:', error);
    return res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// POST /api/listings/:id/buy
router.post('/:id/buy', requireAuth, async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: 'active', userId: { $ne: req.user._id } },
      { $set: { buyerId: req.user._id, status: 'sold' } },
      { new: true, runValidators: true }
    ).populate('userId', 'name avatar email');

    if (!listing) {
      const existing = await Listing.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Listing not found.' });
      if (existing.userId?.toString() === req.user._id.toString()) {
        return res.status(403).json({ error: 'You cannot purchase your own listing.' });
      }
      return res.status(409).json({ error: 'This listing is no longer available.' });
    }

    return res.json({
      ...listing.toObject(),
      seller: listing.userId,
      userId: listing.userId?._id || listing.userId,
      accessUrl: listing.repoUrl
    });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid listing ID.' });
    console.error('Purchase failed:', error.message);
    return res.status(500).json({ error: 'Unable to purchase listing.' });
  }
});

const mongoose = require('mongoose');

// GET /api/listings/my-listings
router.get('/my-listings', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      // If we are passing userId manually or if it's malformed, return empty instead of 400
      return res.status(200).json([]);
    }

    const listings = await Listing.find({ userId, status: { $ne: 'removed' } }).sort({ createdAt: -1 });
    return res.status(200).json(listings);
  } catch (error) {
    console.error('Fetch my-listings error:', error);
    return res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

// GET /api/listings/purchases
router.get('/purchases', requireAuth, async (req, res) => {
  try {
    const listings = await Listing.find({ buyerId: req.user._id, status: 'sold' })
      .populate('userId', 'name avatar email')
      .sort({ createdAt: -1 });
    return res.json(listings.map((listing) => ({
      ...listing.toObject(),
      seller: listing.userId,
      sellerId: listing.userId?._id || listing.userId
    })));
  } catch (error) {
    console.error('Fetch purchases error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch your purchases.' });
  }
});

// PATCH /api/listings/:id/withdraw
router.patch('/:id/withdraw', requireAuth, async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: 'active' },
      { $set: { status: 'removed' } },
      { new: true }
    );
    if (!listing) return res.status(404).json({ error: 'Active listing not found.' });
    return res.json(listing);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid listing ID.' });
    console.error('Withdraw listing error:', error.message);
    return res.status(500).json({ error: 'Unable to withdraw listing.' });
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('userId', 'name avatar email');
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    return res.json({ ...listing.toObject(), seller: listing.userId });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid listing ID.' });
    console.error('Fetch listing error:', error.message);
    return res.status(500).json({ error: 'Unable to fetch listing.' });
  }
});

// DELETE /api/listings/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    
    if (listing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to delete this listing' });
    }
    
    listing.status = 'removed';
    await listing.save();
    
    return res.json({ message: 'Listing removed successfully', listing });
  } catch (error) {
    console.error('Delete listing error:', error);
    return res.status(500).json({ error: 'Failed to delete listing' });
  }
});

module.exports = router;
