const crypto = require('crypto');
const User = require('../models/User');
const { createTransporter, getEmailCredentials } = require('../config/nodemailer');

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function sendOTP(req, res) {
  if (!req.user.email) {
    return res.status(400).json({ success: false, error: 'Your account does not have an email address.' });
  }

  if (req.user.isEmailVerified) {
    return res.status(409).json({ success: false, error: 'Your email is already verified.' });
  }

  try {
    // Validate configuration before persisting an OTP that cannot be delivered.
    const { user: emailUser } = getEmailCredentials();
    const transporter = createTransporter();
    const otp = generateOtp();
    req.user.emailOtp = hashOtp(otp);
    req.user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await req.user.save();

    await transporter.sendMail({
      from: `RepoMarket <${emailUser}>`,
      to: req.user.email,
      subject: 'Your RepoMarket verification code',
      text: `Your RepoMarket email verification code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your RepoMarket email verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
    });

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    // Do not rethrow: an unhandled rejection can terminate the Render web process.
    console.error('OTP delivery failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function verifyOTP(req, res) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

  if (!email || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, error: 'A valid email and 6-digit OTP are required.' });
  }

  if (!req.user.email || req.user.email !== email) {
    return res.status(403).json({ success: false, error: 'The verification email must match the authenticated account.' });
  }

  try {
    const user = await User.findById(req.user._id).select('+emailOtp +otpExpiresAt');
    if (!user || !user.emailOtp || !user.otpExpiresAt || user.otpExpiresAt.getTime() <= Date.now()) {
      return res.status(400).json({ success: false, error: 'This verification code is missing or expired.' });
    }

    const expectedHash = Buffer.from(user.emailOtp, 'hex');
    const providedHash = Buffer.from(hashOtp(otp), 'hex');
    if (expectedHash.length !== providedHash.length || !crypto.timingSafeEqual(expectedHash, providedHash)) {
      return res.status(400).json({ success: false, error: 'The verification code is incorrect.' });
    }

    user.isEmailVerified = true;
    user.emailOtp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'OTP verified successfully', isEmailVerified: true });
  } catch (error) {
    console.error('OTP verification failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { sendOTP, verifyOTP };
