const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const { requireAuth } = require('../middleware/auth');
const { getRepoDetails } = require('../services/githubService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const OpenAI = require('openai');

// POST /api/listings/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

    // Fetch GitHub stats
    const { repoInfo, packageJson, readmeText, fileTree, commits } = await getRepoDetails(repoUrl);

    let analysis = {
      estimatedPrice: 100,
      priceRange: { min: 50, max: 150 },
      rating: 5.0,
      summary: 'Basic fallback reasoning due to missing API key.',
      breakdown: {
        codeQuality: 'Average',
        commitActivity: 'Moderate',
        popularityScore: 5
      }
    };
    
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('your_')) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const prompt = `Evaluate code market value ($USD) based on complexity, stars, forks, and recency.
        
        Repository Info: ${JSON.stringify({
          stargazers_count: repoInfo.stargazers_count,
          forks_count: repoInfo.forks_count,
          open_issues_count: repoInfo.open_issues_count,
          language: repoInfo.language,
          description: repoInfo.description,
          size: repoInfo.size,
          pushed_at: repoInfo.pushed_at
        })}
        README: ${readmeText ? readmeText.substring(0, 500) : 'None'}
        Commits: ${JSON.stringify(commits.slice(0, 5))}
        
        Force Structured JSON Response format:
        {
          "estimatedPrice": 150,
          "priceRange": { "min": 100, "max": 200 },
          "rating": 8.5,
          "summary": "Well-maintained React project with high star count and clear docs.",
          "breakdown": {
            "codeQuality": "High",
            "commitActivity": "Active",
            "popularityScore": 8
          }
        }
        `;
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        });
        
        const responseText = completion.choices[0].message.content;
        analysis = JSON.parse(responseText);
      } catch (err) {
        console.error('OpenAI analysis error', err);
      }
    }

    return res.json({
      ...analysis,
      repoInfo: {
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
        openIssues: repoInfo.open_issues_count,
        language: repoInfo.language
      }
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return res.status(500).json({ error: 'Failed to analyze repository' });
  }
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
    const listings = await Listing.find({ status: 'active' }).sort({ createdAt: -1 });
    return res.json(listings);
  } catch (error) {
    console.error('Fetch listings error:', error);
    return res.status(500).json({ error: 'Failed to fetch listings' });
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
