const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

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

module.exports = router;
