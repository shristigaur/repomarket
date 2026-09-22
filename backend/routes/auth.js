const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { requireAuth, signUser } = require('../middleware/auth');

const router = express.Router();

const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

function redirectAfterOAuth(res, user) {
  const token = signUser(user);
  setAuthCookie(res, token);
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

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ _id: req.user._id, name: req.user.name, email: req.user.email, avatar: req.user.avatar });
});

router.get('/google', (req, res, next) => {
  return passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account', state: true, session: false })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  return passport.authenticate('google', { session: false }, (error, user) => {
    if (error || !user) return res.status(401).json({ error: 'Google authentication failed.' });
    return redirectAfterOAuth(res, user);
  })(req, res, next);
});

router.get('/github', (req, res, next) => {
  return passport.authenticate('github', { scope: ['user:email'], state: true, session: false })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  return passport.authenticate('github', { session: false }, (error, user) => {
    if (error || !user) return res.status(401).json({ error: 'GitHub authentication failed.' });
    return redirectAfterOAuth(res, user);
  })(req, res, next);
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...authCookieOptions, maxAge: undefined });
  return res.json({ message: 'Logged out successfully' });
});

module.exports = router;
