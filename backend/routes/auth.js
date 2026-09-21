const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { requireAuth, signUser } = require('../middleware/auth');
const { sendOTP, verifyOTP } = require('../controllers/authController');

const router = express.Router();

const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

function redirectAfterOAuth(res, user) {
  const token = signUser(user);
  setAuthCookie(res, token);
  // Do not put a JWT in the URL: URLs can leak through browser history and logs.
  return res.redirect(frontendUrl);
}

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

function setAuthCookie(res, token) {
  res.cookie('token', token, authCookieOptions);
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
    setAuthCookie(res, signUser(user));
    return res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
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

    setAuthCookie(res, signUser(user));
    return res.json({ user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to log in.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ _id: req.user._id, name: req.user.name, email: req.user.email, avatar: req.user.avatar, isEmailVerified: req.user.isEmailVerified });
});

router.post('/send-otp', requireAuth, sendOTP);
router.post('/verify-otp', requireAuth, verifyOTP);

function oauthUnavailable(res, provider) {
  return res.status(503).json({ error: `${provider} OAuth is not configured on the server.` });
}

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return oauthUnavailable(res, 'Google');
  // Passport stores a cryptographically random state in the server session and validates it on callback.
  return passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account', state: true, session: false })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return oauthUnavailable(res, 'Google');
  return passport.authenticate('google', { session: false }, (error, user) => {
    if (error || !user) return res.status(401).json({ error: 'Google authentication failed.' });
    return redirectAfterOAuth(res, user);
  })(req, res, next);
});

router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) return oauthUnavailable(res, 'GitHub');
  return passport.authenticate('github', { scope: ['user:email'], state: true, session: false })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) return oauthUnavailable(res, 'GitHub');
  return passport.authenticate('github', { session: false }, (error, user) => {
    if (error || !user) return res.status(401).json({ error: 'GitHub authentication failed.' });
    return redirectAfterOAuth(res, user);
  })(req, res, next);
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...authCookieOptions, maxAge: undefined });
  req.session?.destroy(() => {});
  return res.json({ message: 'Logged out successfully' });
});

module.exports = router;
