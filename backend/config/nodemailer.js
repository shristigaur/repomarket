const nodemailer = require('nodemailer');

function getEmailCredentials() {
  const user = (process.env.EMAIL_USER || '').trim();
  // Google displays app passwords in groups; SMTP must receive the contiguous value.
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
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
}

module.exports = { createTransporter, getEmailCredentials };
