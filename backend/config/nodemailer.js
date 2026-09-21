const nodemailer = require('nodemailer');

function getEmailCredentials() {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be configured.');
  }

  return { user, pass };
}

function createTransporter() {
  const { user, pass } = getEmailCredentials();

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,              // 👈 Port 587 uses STARTTLS (Render par blocked nahi hota)
    secure: false,         // Port 587 ke liye false hona chahiye
    family: 4,             // 👈 IPv4 force karein (ENETUNREACH IPv6 issue fix ke liye)
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false, // TLS Handshake drop hone se roktar hai
      ciphers: 'SSLv3'
    },
    connectionTimeout: 30000, // 30 seconds connection allowance
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });
}

module.exports = { createTransporter, getEmailCredentials };