const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const { requireAuth, signUser } = require('../middleware/auth');

const router = express.Router();

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

router.post('/signup', async (req, res) => {
  const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = new User({ name: fullName, email, password });
    await user.save();
    const token = signUser(user);
    return res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

router.post('/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signUser(user);
    return res.json({ token, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to log in.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ _id: req.user._id, name: req.user.name, email: req.user.email, avatar: req.user.avatar, isEmailVerified: req.user.isEmailVerified });
});

router.post('/send-otp', requireAuth, async (req, res) => {
  if (!req.user.email) {
    return res.status(400).json({ error: 'Your account does not have an email address.' });
  }

  if (req.user.isEmailVerified) {
    return res.status(409).json({ error: 'Your email is already verified.' });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email configuration missing in .env');
    return res.status(500).json({ error: 'Email delivery is not configured on the server.' });
  }

  const otp = generateOtp();
  req.user.emailOtp = hashOtp(otp);
  req.user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await req.user.save();

  try {
    await createTransporter().sendMail({
      from: process.env.EMAIL_USER,
      to: req.user.email,
      subject: 'Your RepoMarket verification code',
      text: `Your RepoMarket email verification code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your RepoMarket email verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
    });
    return res.json({ message: 'Verification code sent.' });
  } catch (error) {
    req.user.emailOtp = undefined;
    req.user.otpExpiresAt = undefined;
    await req.user.save();
    console.error('Nodemailer error:', error);
    return res.status(502).json({ error: 'Unable to send verification email.' });
  }
});

router.post('/verify-otp', requireAuth, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

  if (!email || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'A valid email and 6-digit OTP are required.' });
  }

  if (!req.user.email || req.user.email !== email) {
    return res.status(403).json({ error: 'The verification email must match the authenticated account.' });
  }

  const user = await User.findById(req.user._id).select('+emailOtp +otpExpiresAt');
  if (!user || !user.emailOtp || !user.otpExpiresAt || user.otpExpiresAt.getTime() <= Date.now()) {
    return res.status(400).json({ error: 'This verification code is missing or expired.' });
  }

  const expectedHash = Buffer.from(user.emailOtp, 'hex');
  const providedHash = Buffer.from(hashOtp(otp), 'hex');
  if (expectedHash.length !== providedHash.length || !crypto.timingSafeEqual(expectedHash, providedHash)) {
    return res.status(400).json({ error: 'The verification code is incorrect.' });
  }

  user.isEmailVerified = true;
  user.emailOtp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();
  return res.json({ message: 'Email verified successfully.', isEmailVerified: true });
});

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const token = signUser(req.user);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}?token=${token}`);
});

router.get('/github', passport.authenticate('github', {
  scope: ['user:email'],
  prompt: 'select_account'
}));

router.get('/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
  const token = signUser(req.user);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}?token=${token}`);
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
});

module.exports = router;
