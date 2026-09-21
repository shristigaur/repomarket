const crypto = require('crypto');
const nodemailer = require('nodemailer');

function createTransporter() {
  const emailUser = (process.env.EMAIL_USER || '').trim();
  // Gmail app passwords are often pasted with visual spaces. SMTP requires no spaces.
  const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be configured.');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function sendOtp(req, res) {
  if (!req.user.email) {
    return res.status(400).json({ success: false, error: 'Your account does not have an email address.' });
  }

  if (req.user.isEmailVerified) {
    return res.status(409).json({ success: false, error: 'Your email is already verified.' });
  }

  try {
    const otp = generateOtp();
    req.user.emailOtp = hashOtp(otp);
    req.user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // This can fail when MongoDB is unavailable; keep it inside the catch boundary.
    await req.user.save();

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `RepoMarket <${(process.env.EMAIL_USER || '').trim()}>`,
      to: req.user.email,
      subject: 'Your RepoMarket verification code',
      text: `Your RepoMarket email verification code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your RepoMarket email verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
    });

    return res.status(200).json({ success: true, message: 'Verification code sent.' });
  } catch (error) {
    // Do not rethrow: an unhandled rejection can terminate the Render web process.
    console.error('OTP delivery failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { sendOtp, createTransporter };
