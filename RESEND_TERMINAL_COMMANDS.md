# Resend Migration - Copy-Paste Terminal Commands

All commands ready to copy and paste. Execute in order.

---

## 🚀 Phase 1: Local Setup

### 1.1 Navigate to Backend
```bash
cd backend
```

### 1.2 Uninstall Nodemailer
```bash
npm uninstall nodemailer
```

### 1.3 Install Resend
```bash
npm install resend
```

### 1.4 Verify Installation
```bash
npm list resend
```

### 1.5 Delete Nodemailer Config
```bash
rm config/nodemailer.js
```

### 1.6 Verify Deletion
```bash
ls -la config/
# Should NOT show nodemailer.js
```

---

## 🔑 Phase 2: Get Resend API Key

### 2.1 Create Resend Account
1. Open browser: https://resend.com
2. Click "Sign up"
3. Enter email and password
4. Verify email

### 2.2 Get API Key
1. Go to: https://resend.com/api-keys
2. Click "Create API Key"
3. Name: "RepoMarket Dev"
4. Copy the key (starts with `re_`)

### 2.3 Add to .env
```bash
# Edit backend/.env
# Add this line:
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🧪 Phase 3: Local Testing

### 3.1 Start Backend
```bash
npm start
```

### 3.2 In Another Terminal - Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3.3 Copy Token from Response
```bash
# From the response, copy the token value
# It looks like: eyJ0eXAiOiJKV1QiLCJhbGc...
```

### 3.4 Test Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{}'
```

### 3.5 Check Email
1. Go to test@example.com inbox
2. Look for email from "RepoMarket <onboarding@resend.dev>"
3. Copy the 6-digit OTP code

### 3.6 Test Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### 3.7 Stop Backend
```bash
# Press Ctrl+C in the terminal running npm start
```

---

## 📝 Phase 4: Git Workflow

### 4.1 Check Status
```bash
git status
```

### 4.2 Stage Changes
```bash
git add backend/package.json backend/package-lock.json backend/controllers/authController.js
```

### 4.3 Stage Deletion
```bash
git add backend/config/nodemailer.js
```

### 4.4 Verify Staged Changes
```bash
git status
# Should show modified and deleted files
```

### 4.5 Commit Changes
```bash
git commit -m "refactor: replace Nodemailer with Resend API for OTP delivery

- Remove nodemailer dependency and config/nodemailer.js
- Install resend package
- Update authController.js to use Resend API
- Replace SMTP-based email with HTTPS-based Resend
- Fixes Render SMTP port blocking and ENETUNREACH errors
- Preserves all OTP logic: generation, hashing, expiration, verification"
```

### 4.6 View Commit
```bash
git log --oneline -1
```

### 4.7 Push to GitHub
```bash
git push origin main
```

---

## 🌐 Phase 5: Render Deployment

### 5.1 Update Environment Variables (via Dashboard)

**In Render Dashboard:**
1. Go to your backend service
2. Click "Environment"
3. Delete `EMAIL_USER`
4. Delete `EMAIL_PASS`
5. Add new variable:
   - Key: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. Click "Save"

### 5.2 Manual Deploy (if needed)
```bash
# If using Render CLI
render deploy --service-id=YOUR_SERVICE_ID
```

### 5.3 Check Deployment Status
1. Go to Render Dashboard
2. Select backend service
3. Go to "Deployments" tab
4. Wait for status to show "Live"

### 5.4 View Logs
1. Go to Render Dashboard
2. Select backend service
3. Go to "Logs" tab
4. Look for "Server running on port 5000"

---

## ✅ Phase 6: Production Verification

### 6.1 Test Production Endpoint
```bash
curl https://your-render-url.onrender.com/api/auth/send-otp \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6.2 Check Production Logs
1. Go to Render Dashboard
2. Select backend service
3. Go to "Logs" tab
4. Search for "OTP" or "error"
5. Should see "OTP sent successfully"

### 6.3 Test Full Flow in Production
1. Go to https://your-frontend-url.vercel.app/signup
2. Create account with real email
3. Request OTP
4. Check email inbox
5. Verify OTP
6. Should succeed

---

## 🔍 Verification Commands

### Check Nodemailer Removed
```bash
grep -r "nodemailer" backend/
# Should return nothing
```

### Check Resend Added
```bash
grep -r "Resend" backend/controllers/authController.js
# Should show: const { Resend } = require('resend');
```

### Check Package.json
```bash
grep "resend\|nodemailer" backend/package.json
# Should show: "resend": "^3.0.0"
# Should NOT show nodemailer
```

### Check Config Deleted
```bash
ls -la backend/config/nodemailer.js
# Should show: No such file or directory
```

### Check .env
```bash
grep "RESEND_API_KEY\|EMAIL_USER\|EMAIL_PASS" backend/.env
# Should show: RESEND_API_KEY=re_...
# Should NOT show EMAIL_USER or EMAIL_PASS
```

---

## 🐛 Troubleshooting Commands

### If Backend Won't Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### If Resend Not Found
```bash
# Verify installation
npm list resend

# If not installed
npm install resend
```

### If Nodemailer Still Referenced
```bash
# Find all references
grep -r "nodemailer" backend/

# Find all references to config/nodemailer
grep -r "config/nodemailer" backend/
```

### If OTP Not Sending
```bash
# Check logs for errors
# In terminal running npm start, look for:
# - "RESEND_API_KEY is not configured"
# - "Resend API error"
# - "OTP delivery failed"
```

### If Deployment Fails
```bash
# Check git push succeeded
git log --oneline -1

# Check remote
git remote -v

# Force push if needed (use with caution)
git push origin main --force
```

---

## 📊 Quick Reference

| Step | Command | Time |
|------|---------|------|
| Uninstall Nodemailer | `npm uninstall nodemailer` | 10s |
| Install Resend | `npm install resend` | 30s |
| Delete Config | `rm config/nodemailer.js` | 5s |
| Start Backend | `npm start` | 5s |
| Test Signup | `curl -X POST ...` | 10s |
| Test OTP | `curl -X POST ...` | 10s |
| Git Commit | `git commit -m "..."` | 10s |
| Git Push | `git push origin main` | 20s |
| Render Deploy | Manual via dashboard | 2-5 min |
| **Total** | | **~10 min** |

---

## 🎯 Success Indicators

After running all commands, you should see:

✅ `npm list resend` shows version
✅ `ls config/nodemailer.js` shows "No such file"
✅ Backend starts without errors
✅ OTP email received in inbox
✅ Git push succeeds
✅ Render deployment shows "Live"
✅ Production OTP works

---

## 📝 Notes

- Replace `YOUR_TOKEN_HERE` with actual token from signup response
- Replace `test@example.com` with your test email
- Replace `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual Resend API key
- Replace `your-render-url.onrender.com` with your actual Render URL
- Replace `your-frontend-url.vercel.app` with your actual frontend URL

---

## 🔐 Security Reminders

- ✅ Never commit `.env` file
- ✅ Never share API keys in chat/email
- ✅ Use different keys for dev/prod
- ✅ Rotate keys if compromised
- ✅ Keep `.gitignore` updated

