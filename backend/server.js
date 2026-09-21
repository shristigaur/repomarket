const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const { getRepoDetails } = require('./services/githubService');
const { analyzeRepoCode } = require('./services/aiService');
const { connectDatabase } = require('./config/database');
const Listing = require('./models/Listing');
const User = require('./models/User');
const Rating = require('./models/Rating');
const { configurePassport } = require('./config/passport');
const { requireAuth, optionalAuth } = require('./middleware/auth');
const { requireEmailVerified } = require('./middleware/requireEmailVerified');
const assistantRouter = require('./routes/assistant');
const authRouter = require('./routes/auth');

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = new Set([
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean).map((origin) => origin.replace(/\/$/, '')));

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(cors({
  // Credentials require a specific matching origin; `*` would make browsers reject cookies.
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  name: 'oauth_state',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // Persist Passport's OAuth state outside process memory so restarts and multiple instances work.
  store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 10 * 60 * 1000
  }
}));
configurePassport();
app.use(passport.initialize());
app.use('/api/assistant', assistantRouter);
app.use('/api/auth', authRouter);

function calculateMarketRate(score) {
  const normalizedScore = Math.min(100, Math.max(1, Number(score) || 1));
  return Math.max(100, Math.round((normalizedScore * 50) / 50) * 50);
}

app.post('/api/listings', requireAuth, requireEmailVerified, async (req, res) => {
  try {
    const { repoUrl, repoName, price, sellerEmail, aiReport } = req.body || {};
    if (!aiReport || typeof aiReport.codeHealthScore !== 'number') {
      return res.status(400).json({ error: 'A validated AI report is required before publishing.' });
    }

    const listing = await Listing.create({
      sellerId: req.user._id,
      repoUrl,
      repoName,
      price,
      marketRate: calculateMarketRate(aiReport.codeHealthScore),
      sellerEmail,
      aiReport
    });
    if (req.user.role !== 'SELLER') {
      req.user.role = 'SELLER';
      await req.user.save();
    }
    return res.status(201).json(listing);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    console.error('Listing creation failed:', error.message);
    return res.status(500).json({ error: 'Unable to save listing.' });
  }
});

app.patch('/api/listings/:id/complete', requireAuth, requireEmailVerified, async (req, res) => {
  try {
    const { buyerId } = req.body || {};
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.sellerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the listing seller can complete this transaction.' });
    }
    if (!mongoose.isValidObjectId(buyerId)) return res.status(400).json({ error: 'A valid buyerId is required.' });
    const buyer = await User.findById(buyerId);
    if (!buyer) return res.status(404).json({ error: 'Buyer not found.' });
    if (listing.status !== 'ACTIVE') return res.status(409).json({ error: 'Only active listings can be completed.' });
    listing.buyerId = buyer._id;
    listing.status = 'SOLD';
    await listing.save();
    return res.json(listing);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid listing ID.' });
    console.error('Transaction completion failed:', error.message);
    return res.status(500).json({ error: 'Unable to complete transaction.' });
  }
});

app.post('/api/listings/:id/purchase', requireAuth, requireEmailVerified, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.status !== 'ACTIVE') return res.status(409).json({ error: 'Only active listings can be purchased.' });
    if (listing.sellerId?.toString() === req.user._id.toString()) {
      return res.status(403).json({ error: 'You cannot purchase your own listing.' });
    }
    listing.buyerId = req.user._id;
    listing.status = 'SOLD';
    await listing.save();
    return res.json(listing);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid listing ID.' });
    console.error('Purchase failed:', error.message);
    return res.status(500).json({ error: 'Unable to purchase listing.' });
  }
});

app.patch('/api/listings/:id/withdraw', requireAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.sellerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the listing seller can withdraw this listing.' });
    }
    if (listing.status !== 'ACTIVE') {
      return res.status(409).json({ error: 'Only active listings can be withdrawn.' });
    }
    listing.status = 'WITHDRAWN';
    await listing.save();
    return res.json(listing);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid listing ID.' });
    console.error('Listing withdrawal failed:', error.message);
    return res.status(500).json({ error: 'Unable to withdraw listing.' });
  }
});

app.post('/api/ratings', requireAuth, async (req, res) => {
  try {
    const { listingId, revieweeId, rating, comment } = req.body || {};
    const numericRating = Number(rating);
    if (!listingId || !revieweeId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'listingId, revieweeId, and a whole-number rating from 1 to 5 are required.' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.status !== 'SOLD') return res.status(409).json({ error: 'Ratings are available only after a completed transaction.' });

    const reviewerId = req.user._id.toString();
    const isBuyer = listing.buyerId?.toString() === reviewerId;
    const isSeller = listing.sellerId?.toString() === reviewerId;
    const validReviewee = (isBuyer && listing.sellerId?.toString() === revieweeId) || (isSeller && listing.buyerId?.toString() === revieweeId);
    if (!validReviewee) return res.status(403).json({ error: 'Only transaction participants can rate each other.' });

    const review = await Rating.create({ listingId, reviewerId: req.user._id, revieweeId, rating: numericRating, comment });
    const aggregate = await Rating.aggregate([
      { $match: { revieweeId: new mongoose.Types.ObjectId(revieweeId) } },
      { $group: { _id: '$revieweeId', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);
    await User.findByIdAndUpdate(revieweeId, {
      averageRating: Number(aggregate[0].averageRating.toFixed(2)),
      totalReviews: aggregate[0].totalReviews
    });
    return res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'You have already rated this participant for this listing.' });
    if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ error: 'Invalid rating data.' });
    console.error('Rating creation failed:', error.message);
    return res.status(500).json({ error: 'Unable to save rating.' });
  }
});

app.get('/api/listings', async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    return res.json(listings);
  } catch (error) {
    console.error('Listing lookup failed:', error.message);
    return res.status(500).json({ error: 'Unable to fetch listings.' });
  }
});

app.get('/api/listings/mine', requireAuth, async (req, res) => {
  try {
    const listings = await Listing.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
    return res.json(listings);
  } catch (error) {
    console.error('Seller listing lookup failed:', error.message);
    return res.status(500).json({ error: 'Unable to fetch your listings.' });
  }
});

app.get('/api/listings/purchases', requireAuth, async (req, res) => {
  try {
    const listings = await Listing.find({ buyerId: req.user._id, status: 'SOLD' }).sort({ createdAt: -1 });
    return res.json(listings);
  } catch (error) {
    console.error('Buyer purchase lookup failed:', error.message);
    return res.status(500).json({ error: 'Unable to fetch your purchases.' });
  }
});

app.get('/api/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    return res.json(listing);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid listing ID.' });
    }

    console.error('Listing lookup failed:', error.message);
    return res.status(500).json({ error: 'Unable to fetch listing.' });
  }
});

app.post('/api/repos/analyze', async (req, res) => {
  const { repoUrl } = req.body || {};

  if (!repoUrl) {
    return res.status(400).json({
      error: 'A valid GitHub repository URL is required in the repoUrl field.'
    });
  }

  try {
    const { repoInfo, packageJson, readmeText, fileTree, commits } = await getRepoDetails(repoUrl);

    const repositoryDetails = {
      ...repoInfo,
      packageJson,
      readme: readmeText,
      fileTree,
      commits
    };
    let aiReport;

    try {
      aiReport = await analyzeRepoCode({ readmeText, packageJson, fileTree, commits });
    } catch (error) {
      console.error('AI repository analysis failed:', error.message);
      return res.status(502).json({
        error: 'Unable to generate an AI report for this repository.'
      });
    }

    return res.json({
      ...repositoryDetails,
      aiReport,
      marketRate: calculateMarketRate(aiReport.codeHealthScore)
    });
  } catch (error) {
    const githubStatus = error.response?.status;
    const status = githubStatus === 404 ? 404 : githubStatus === 403 ? 429 : error.message.includes('valid GitHub') ? 400 : 502;
    const errorMessage = status === 404
      ? 'Repository not found or private. Use a public GitHub repository URL.'
      : status === 429
        ? 'GitHub rate limit reached. Try again later or configure a GitHub token.'
        : status === 400
          ? error.message
          : 'Unable to fetch repository details from GitHub.';
    return res.status(status).json({
      error: errorMessage
    });
  }
});

async function startServer() {
  try {
    await connectDatabase();
    app.listen(port, () => {
      console.log(`Backend server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

startServer();
