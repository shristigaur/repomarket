require('dotenv').config();

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Rating = require('../models/Rating');

const API_BASE_URL = process.env.SANITY_API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const runId = crypto.randomBytes(6).toString('hex');
const createdUserIds = [];
const createdListingIds = [];

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { response, body };
}

function report(score = 82) {
  return { codeHealthScore: score };
}

async function checkOAuthEntryRoute() {
  const { response } = await request('/auth/google');
  const configured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  if (configured) {
    assert.ok([302, 303].includes(response.status), `Expected OAuth redirect, received ${response.status}`);
    console.log('PASS OAuth Google entry route (GET /auth/google)');
  } else {
    assert.equal(response.status, 503);
    console.log('SKIP OAuth callback completion: Google credentials are not configured; entry route correctly returns 503.');
  }
}

async function main() {
  await mongoose.connect(process.env.DATABASE_URL);

  const otpUser = await User.create({
    name: `OTP Sanity ${runId}`,
    email: `otp-${runId}@example.test`,
    role: 'BUYER',
    isEmailVerified: false,
    emailOtp: crypto.createHash('sha256').update('123456').digest('hex'),
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });
  createdUserIds.push(otpUser._id);
  const otpToken = tokenFor(otpUser);

  await checkOAuthEntryRoute();

  const verifyOtp = await request('/auth/verify-otp', {
    method: 'POST',
    headers: { Authorization: `Bearer ${otpToken}` },
    body: JSON.stringify({ email: otpUser.email, otp: '123456' })
  });
  assert.equal(verifyOtp.response.status, 200);
  const verifiedUser = await User.findById(otpUser._id);
  assert.equal(verifiedUser.isEmailVerified, true);
  console.log('PASS POST /auth/verify-otp updates isEmailVerified');

  const seller = await User.create({ name: `Seller Sanity ${runId}`, email: `seller-${runId}@example.test`, role: 'SELLER', isEmailVerified: true });
  const buyer = await User.create({ name: `Buyer Sanity ${runId}`, email: `buyer-${runId}@example.test`, role: 'BUYER', isEmailVerified: true });
  createdUserIds.push(seller._id, buyer._id);
  const sellerToken = tokenFor(seller);
  const buyerToken = tokenFor(buyer);

  const createListing = await request('/listings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({
      repoUrl: `https://github.com/repomarket/sanity-${runId}`,
      repoName: `sanity-${runId}`,
      price: 800,
      aiReport: report()
    })
  });
  assert.equal(createListing.response.status, 201);
  assert.ok(createListing.body._id);
  createdListingIds.push(createListing.body._id);
  assert.equal((await Listing.findById(createListing.body._id)).price, 800);
  console.log('PASS authenticated POST /listings persists to MongoDB');

  const assistant = await request('/assistant/chat', {
    method: 'POST',
    headers: { Origin: 'http://localhost:5173' },
    body: JSON.stringify({ message: 'Reply with one short valuation tip.', history: [] })
  });
  assert.equal(assistant.response.status, 200);
  assert.equal(typeof assistant.body.reply, 'string');
  assert.equal(assistant.response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  console.log('PASS POST /assistant/chat returns JSON reply with CORS headers');

  const withdrawListing = await Listing.create({ sellerId: seller._id, repoUrl: `https://github.com/repomarket/withdraw-${runId}`, repoName: `withdraw-${runId}`, price: 100, marketRate: 100 });
  createdListingIds.push(withdrawListing._id);
  const withdraw = await request(`/listings/${withdrawListing._id}/withdraw`, { method: 'PATCH', headers: { Authorization: `Bearer ${sellerToken}` } });
  assert.equal(withdraw.response.status, 200);
  assert.equal((await Listing.findById(withdrawListing._id)).status, 'WITHDRAWN');
  console.log('PASS PATCH /listings/:id/withdraw updates status');

  const purchase = await request(`/listings/${createListing.body._id}/purchase`, { method: 'POST', headers: { Authorization: `Bearer ${buyerToken}` } });
  assert.equal(purchase.response.status, 200);
  assert.equal((await Listing.findById(createListing.body._id)).status, 'SOLD');

  const rating = await request('/ratings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ listingId: createListing.body._id, revieweeId: seller._id.toString(), rating: 5, comment: 'Sanity check rating' })
  });
  assert.equal(rating.response.status, 201);
  const ratedSeller = await User.findById(seller._id);
  assert.equal(ratedSeller.averageRating, 5);
  assert.equal(ratedSeller.totalReviews, 1);
  console.log('PASS POST /ratings updates averageRating and totalReviews');

  console.log('\nAll available RepoMarket sanity checks passed.');
} 

main()
  .catch((error) => {
    console.error('\nSANITY CHECK FAILED:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState === 1) {
      await Rating.deleteMany({ comment: 'Sanity check rating' });
      if (createdListingIds.length) await Listing.deleteMany({ _id: { $in: createdListingIds } });
      if (createdUserIds.length) await User.deleteMany({ _id: { $in: createdUserIds } });
      await mongoose.disconnect();
    }
  });
