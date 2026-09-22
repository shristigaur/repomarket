# Nodemailer to Resend API Migration Guide

Complete refactoring guide to replace Nodemailer with Resend API for OTP email delivery.

---

## 🎯 Overview

**Problem:** Render blocks outbound SMTP port 587, causing ENETUNREACH connection timeouts with Nodemailer.

**Solution:** Switch to Resend API - HTTPS-based email delivery service with no port blocking issues.

**Benefits:**
- ✅ No SMTP port blocking on Render
- ✅ HTTPS-based (always works)
- ✅ Simpler integration
- ✅ Better reliability
- ✅ No configuration complexity

---

## 📋 Step 1: Uninstall Nodemailer

### Terminal Command
```bash
cd backend
npm uninstall nodemailer
```

### What Gets Removed
- `nodemailer` package from `package.json`
- `node_modules/nodemailer` directory
- `package-lock.json` updated

---

## 📋 Step 2: Install Resend

### Terminal Command
```bash
npm install resend
```

### Verification
```bash
npm list resend
# Should show: resend@x.x.x
```

---

## 📋 Step 3: Delete Nodemailer Config File

### Terminal Command
```bash
rm backend/config/nodemailer.js
```

### What Gets Deleted
- `backend/config/nodemailer.js` - No longer needed

---

## 📋 Step 4: Update authController.js

Replace the entire file with the new Resend-based implementation:

### File: `backend/controllers/authController.js`

```javascript
const crypto = require('crypto');
const { Resend } = require('resend');
const User = require('../models/User');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

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

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return res.status(500).json({ success: false, error: 'Email service is not configured on the server.' });
  }

  try {
    const otp = generateOtp();
    req.user.emailOtp = hashOtp(otp);
    req.user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await req.user.save();

    // Send OTP via Resend API
    const response = await resend.emails.send({
      from: 'RepoMarket <onboarding@resend.dev>',
      to: req.user.email,
      subject: 'Your RepoMarket verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p style="color: #666; font-size: 16px;">Your RepoMarket email verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 5px; margin: 0;">${otp}</p>
          </div>
          <p style="color: #999; font-size: 14px;">This code expires in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    });

    // Check if email was sent successfully
    if (response.error) {
      console.error('Resend API error:', response.error);
      // Clear the OTP since it couldn't be delivered
      req.user.emailOtp = undefined;
      req.user.otpExpiresAt = undefined;
      await req.user.save();
      return res.status(500).json({ success: false, error: 'Failed to send verification email.' });
    }

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP delivery failed:', error);
    // Clear the OTP on error
    req.user.emailOtp = undefined;
    req.user.otpExpiresAt = undefined;
    await req.user.save();
    return res.status(500).json({ success: false, error: 'Failed to send verification email.' });
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
    return res.status(500).json({ success: false, error: 'Failed to verify OTP.' });
  }
}

module.exports = { sendOTP, verifyOTP };
```

---

## 📋 Step 5: Update Environment Variables

### Local Development (.env)

**Remove these:**
```
EMAIL_USER=shristigaur24@navgurukul.org
EMAIL_PASS=wpvu wlsfjwyv pvkm
```

**Add this:**
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Get Resend API Key

1. Go to https://resend.com
2. Sign up for free account
3. Go to API Keys section
4. Create new API key
5. Copy the key (starts with `re_`)
6. Add to `.env` file

---

## 📋 Step 6: Update Render Environment Variables

### Remove from Render Dashboard

1. Go to Render Dashboard
2. Select your backend service
3. Go to Environment
4. Delete these variables:
   - `EMAIL_USER`
   - `EMAIL_PASS`

### Add to Render Dashboard

1. Go to Render Dashboard
2. Select your backend service
3. Go to Environment
4. Add new variable:
   - Key: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (your Resend API key)
5. Click "Save"

---

## 📋 Step 7: Test Locally

### Start Backend
```bash
cd backend
npm start
```

### Test OTP Sending

**Using cURL:**
```bash
# 1. Signup to get token
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. Send OTP (use token from signup response)
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{}'

# 3. Check email for OTP code
# 4. Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

**Using Frontend:**
1. Signup with test email
2. Go to email verification page
3. Click "Send verification code"
4. Check your email inbox
5. Enter the 6-digit code
6. Click "Verify"
7. ✅ Should show success message

---

## 📋 Step 8: Git Workflow & Deployment

### Commit Changes

```bash
# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "refactor: replace Nodemailer with Resend API for OTP delivery

- Remove nodemailer dependency and config/nodemailer.js
- Install resend package
- Update authController.js to use Resend API
- Replace SMTP-based email with HTTPS-based Resend
- Fixes Render SMTP port blocking and ENETUNREACH errors
- Preserves all OTP logic: generation, hashing, expiration, verification"

# View commit
git log --oneline -1
```

### Push to GitHub

```bash
# Push to main branch
git push origin main

# Or if using different branch
git push origin your-branch-name
```

### Deploy on Render

**Option 1: Auto-Deploy (if connected)**
- Render automatically deploys when you push to main
- Check Render Dashboard → Deployments
- Wait for deployment to complete (2-5 minutes)

**Option 2: Manual Deploy**
```bash
# If using Render CLI
render deploy --service-id=YOUR_SERVICE_ID
```

**Option 3: Redeploy from Dashboard**
1. Go to Render Dashboard
2. Select your backend service
3. Click "Manual Deploy"
4. Select branch (main)
5. Click "Deploy"
6. Wait for deployment to complete

### Verify Deployment

1. Go to Render Dashboard
2. Check service status (should be "Live")
3. Check logs for errors:
   ```
   Logs → Filter by "error" or "OTP"
   ```
4. Test OTP endpoint:
   ```bash
   curl https://your-render-url.onrender.com/api/auth/send-otp \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 🔍 Verification Checklist

### Local Testing
- [ ] `npm install resend` succeeds
- [ ] `npm uninstall nodemailer` succeeds
- [ ] `rm config/nodemailer.js` succeeds
- [ ] Backend starts without errors
- [ ] No import errors for nodemailer
- [ ] RESEND_API_KEY in .env
- [ ] OTP sends successfully
- [ ] Email received in inbox
- [ ] OTP verification works
- [ ] No console errors

### Render Deployment
- [ ] Git push succeeds
- [ ] Render deployment starts
- [ ] Deployment completes (status: Live)
- [ ] No build errors in logs
- [ ] RESEND_API_KEY added to environment
- [ ] EMAIL_USER removed from environment
- [ ] EMAIL_PASS removed from environment
- [ ] OTP endpoint responds
- [ ] Email sends from production
- [ ] No ENETUNREACH errors in logs

---

## 🐛 Troubleshooting

### Issue: "RESEND_API_KEY is not configured"

**Solution:**
1. Check `.env` file has `RESEND_API_KEY=re_...`
2. Restart backend: `npm start`
3. For Render: Check environment variables in dashboard
4. Redeploy after adding key

### Issue: "Failed to send verification email"

**Solution:**
1. Verify Resend API key is valid
2. Check email address is correct
3. Check Resend account has credits
4. Check backend logs for error details
5. Try with different email address

### Issue: "Cannot find module 'resend'"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: "Nodemailer still being imported"

**Solution:**
1. Search for `nodemailer` in codebase:
   ```bash
   grep -r "nodemailer" backend/
   ```
2. Remove any remaining imports
3. Check `config/` directory is cleaned up
4. Restart backend

### Issue: Deployment fails on Render

**Solution:**
1. Check build logs for errors
2. Verify `package.json` has `resend` dependency
3. Verify `package.json` doesn't have `nodemailer`
4. Check Node.js version compatibility
5. Try manual redeploy

---

## 📊 Before & After Comparison

### Before (Nodemailer)
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

await transporter.sendMail({
  from: `RepoMarket <${emailUser}>`,
  to: email,
  subject: 'OTP',
  html: `...`
});
```

**Issues:**
- ❌ Port 587 blocked by Render
- ❌ ENETUNREACH errors
- ❌ SMTP configuration complexity
- ❌ Gmail app password required
- ❌ TLS handshake issues

### After (Resend)
```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'RepoMarket <onboarding@resend.dev>',
  to: email,
  subject: 'OTP',
  html: `...`
});
```

**Benefits:**
- ✅ HTTPS-based (no port blocking)
- ✅ No ENETUNREACH errors
- ✅ Simple API
- ✅ No credentials needed
- ✅ Reliable delivery

---

## 🔐 Security Notes

### API Key Safety
- ✅ Never commit `.env` to git
- ✅ Use `.gitignore` to exclude `.env`
- ✅ Store key in Render environment variables
- ✅ Rotate key if compromised
- ✅ Use different keys for dev/prod

### Email Security
- ✅ OTP still hashed with SHA-256
- ✅ Timing-safe comparison preserved
- ✅ 10-minute expiration maintained
- ✅ Email verification still required
- ✅ No sensitive data in logs

---

## 📚 Resend Documentation

- **Official Docs:** https://resend.com/docs
- **API Reference:** https://resend.com/docs/api-reference
- **Email Templates:** https://resend.com/docs/templates
- **Pricing:** https://resend.com/pricing (Free tier available)

---

## ✅ Summary

| Step | Command | Status |
|------|---------|--------|
| 1 | `npm uninstall nodemailer` | ✅ |
| 2 | `npm install resend` | ✅ |
| 3 | `rm config/nodemailer.js` | ✅ |
| 4 | Update `authController.js` | ✅ |
| 5 | Update `.env` | ✅ |
| 6 | Update Render env vars | ✅ |
| 7 | Test locally | ✅ |
| 8 | Git commit & push | ✅ |
| 9 | Deploy on Render | ✅ |
| 10 | Verify production | ✅ |

---

## 🎯 Next Steps

1. ✅ Complete all steps above
2. ✅ Test OTP flow locally
3. ✅ Deploy to Render
4. ✅ Test OTP flow in production
5. ✅ Monitor logs for errors
6. ✅ Remove old Nodemailer documentation
7. ✅ Update team documentation

