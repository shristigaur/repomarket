# Resend API Implementation - Quick Checklist

Complete step-by-step checklist to migrate from Nodemailer to Resend.

---

## ✅ Phase 1: Local Setup (5 minutes)

### Step 1: Uninstall Nodemailer
```bash
cd backend
npm uninstall nodemailer
```
- [ ] Command executes successfully
- [ ] `nodemailer` removed from `package.json`
- [ ] `package-lock.json` updated

### Step 2: Install Resend
```bash
npm install resend
```
- [ ] Command executes successfully
- [ ] `resend` added to `package.json`
- [ ] `node_modules/resend` directory created
- [ ] Verify: `npm list resend` shows version

### Step 3: Delete Nodemailer Config
```bash
rm backend/config/nodemailer.js
```
- [ ] File deleted successfully
- [ ] No import errors when backend starts

### Step 4: Verify Code Changes
```bash
# Check authController.js is updated
grep -n "Resend" backend/controllers/authController.js
```
- [ ] `const { Resend } = require('resend');` present
- [ ] `const resend = new Resend(...)` present
- [ ] `resend.emails.send()` used instead of `transporter.sendMail()`
- [ ] No `nodemailer` imports remain

### Step 5: Update .env File
```bash
# Edit backend/.env
# Remove:
# EMAIL_USER=...
# EMAIL_PASS=...

# Add:
# RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- [ ] `EMAIL_USER` removed
- [ ] `EMAIL_PASS` removed
- [ ] `RESEND_API_KEY` added with valid key
- [ ] File saved

---

## ✅ Phase 2: Get Resend API Key (2 minutes)

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Click "Sign up"
3. Enter email and password
4. Verify email
- [ ] Account created
- [ ] Email verified

### Step 2: Get API Key
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it: "RepoMarket Dev"
4. Copy the key (starts with `re_`)
- [ ] API key created
- [ ] Key copied to clipboard
- [ ] Key starts with `re_`

### Step 3: Add to .env
```bash
# backend/.env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- [ ] Key added to `.env`
- [ ] File saved
- [ ] No spaces around `=`

---

## ✅ Phase 3: Local Testing (10 minutes)

### Step 1: Start Backend
```bash
cd backend
npm start
```
- [ ] Backend starts without errors
- [ ] No "Cannot find module" errors
- [ ] No "RESEND_API_KEY" warnings
- [ ] Server listening on port 5000

### Step 2: Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```
- [ ] Response: 201 status
- [ ] Response includes user data
- [ ] Token in response (or cookie)
- [ ] User created in MongoDB

### Step 3: Extract Token
```bash
# From signup response, copy the token value
# Or check cookies: document.cookie in browser
```
- [ ] Token obtained
- [ ] Token format: `eyJ...` (JWT)

### Step 4: Test Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{}'
```
- [ ] Response: 200 status
- [ ] Response: `{ "success": true, "message": "OTP sent successfully" }`
- [ ] No errors in backend logs
- [ ] Check email inbox for OTP

### Step 5: Verify Email Received
1. Check email inbox (test@example.com)
2. Look for email from "RepoMarket <onboarding@resend.dev>"
3. Copy the 6-digit OTP code
- [ ] Email received
- [ ] From address correct
- [ ] OTP code visible
- [ ] Code is 6 digits

### Step 6: Test Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```
- [ ] Response: 200 status
- [ ] Response: `{ "success": true, "isEmailVerified": true }`
- [ ] No errors in backend logs

### Step 7: Check Backend Logs
```bash
# Look for these in terminal output:
# - No "nodemailer" errors
# - No "ENETUNREACH" errors
# - No "SMTP" errors
# - No "Resend API error" messages
```
- [ ] No error messages
- [ ] No warnings about missing config
- [ ] Clean logs

---

## ✅ Phase 4: Git & Deployment (5 minutes)

### Step 1: Check Git Status
```bash
git status
```
- [ ] `backend/package.json` modified
- [ ] `backend/package-lock.json` modified
- [ ] `backend/controllers/authController.js` modified
- [ ] `backend/config/nodemailer.js` deleted
- [ ] `backend/.env` modified (not staged)

### Step 2: Stage Changes
```bash
git add backend/package.json backend/package-lock.json backend/controllers/authController.js
git add backend/config/nodemailer.js  # This stages the deletion
```
- [ ] Changes staged
- [ ] `.env` NOT staged (keep local)

### Step 3: Commit Changes
```bash
git commit -m "refactor: replace Nodemailer with Resend API for OTP delivery

- Remove nodemailer dependency and config/nodemailer.js
- Install resend package
- Update authController.js to use Resend API
- Replace SMTP-based email with HTTPS-based Resend
- Fixes Render SMTP port blocking and ENETUNREACH errors
- Preserves all OTP logic: generation, hashing, expiration, verification"
```
- [ ] Commit created
- [ ] Message descriptive
- [ ] All changes included

### Step 4: Verify Commit
```bash
git log --oneline -1
git show --stat
```
- [ ] Commit shows correct files
- [ ] Commit message clear
- [ ] No `.env` file in commit

### Step 5: Push to GitHub
```bash
git push origin main
```
- [ ] Push succeeds
- [ ] No merge conflicts
- [ ] GitHub shows new commit

---

## ✅ Phase 5: Render Deployment (10 minutes)

### Step 1: Update Environment Variables

**Go to Render Dashboard:**
1. Select your backend service
2. Click "Environment"
3. Find and delete:
   - `EMAIL_USER`
   - `EMAIL_PASS`
4. Click "Add Environment Variable"
5. Enter:
   - Key: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. Click "Save"

- [ ] `EMAIL_USER` deleted
- [ ] `EMAIL_PASS` deleted
- [ ] `RESEND_API_KEY` added
- [ ] Changes saved

### Step 2: Trigger Deployment

**Option A: Auto-Deploy (if enabled)**
- [ ] Render automatically deploys after git push
- [ ] Check Deployments tab

**Option B: Manual Deploy**
1. Go to Render Dashboard
2. Select backend service
3. Click "Manual Deploy"
4. Select branch: `main`
5. Click "Deploy"

- [ ] Deployment started
- [ ] Status shows "Building"

### Step 3: Monitor Deployment
```bash
# In Render Dashboard, watch the logs:
# - Should see "npm install"
# - Should see "resend" being installed
# - Should NOT see "nodemailer"
# - Should see "Server running on port 5000"
```
- [ ] Build starts
- [ ] No build errors
- [ ] Dependencies installed
- [ ] Server starts

### Step 4: Wait for Completion
- [ ] Deployment status: "Live"
- [ ] Service status: "Live"
- [ ] No error messages in logs
- [ ] Takes 2-5 minutes

### Step 5: Verify Production
```bash
# Test production endpoint
curl https://your-render-url.onrender.com/api/auth/send-otp \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Endpoint responds
- [ ] No 500 errors
- [ ] Response successful

---

## ✅ Phase 6: Production Testing (5 minutes)

### Step 1: Signup in Production
1. Go to https://your-frontend-url.vercel.app/signup
2. Create account with real email
3. Submit form
- [ ] Account created
- [ ] Redirected to home

### Step 2: Request OTP
1. Go to email verification page
2. Click "Send verification code"
3. Wait for email
- [ ] Email received
- [ ] From: "RepoMarket <onboarding@resend.dev>"
- [ ] Contains 6-digit OTP

### Step 3: Verify OTP
1. Enter OTP in form
2. Click "Verify"
3. Should show success
- [ ] Verification succeeds
- [ ] Email marked as verified
- [ ] No errors

### Step 4: Check Logs
```bash
# In Render Dashboard, check logs for:
# - No "ENETUNREACH" errors
# - No "SMTP" errors
# - No "nodemailer" references
# - "OTP sent successfully" messages
```
- [ ] No SMTP errors
- [ ] No connection errors
- [ ] Clean logs

---

## ✅ Final Verification

### Code Changes
- [ ] `authController.js` uses Resend
- [ ] `package.json` has `resend`, not `nodemailer`
- [ ] `config/nodemailer.js` deleted
- [ ] No `nodemailer` imports anywhere

### Environment
- [ ] Local `.env` has `RESEND_API_KEY`
- [ ] Render has `RESEND_API_KEY`
- [ ] Render doesn't have `EMAIL_USER`
- [ ] Render doesn't have `EMAIL_PASS`

### Functionality
- [ ] OTP sends successfully
- [ ] Email received in inbox
- [ ] OTP verification works
- [ ] No ENETUNREACH errors
- [ ] No SMTP errors

### Deployment
- [ ] Git commit created
- [ ] Git push successful
- [ ] Render deployment successful
- [ ] Production working

---

## 🎯 Success Criteria

✅ All items checked = Migration complete!

**You should see:**
- No more ENETUNREACH errors
- No more SMTP port blocking
- Emails sending reliably
- OTP verification working
- Clean production logs

---

## 📞 Troubleshooting

### If OTP doesn't send:
1. Check `RESEND_API_KEY` in `.env`
2. Verify key starts with `re_`
3. Check backend logs for errors
4. Try different email address
5. Check Resend account has credits

### If deployment fails:
1. Check git push succeeded
2. Check Render logs for build errors
3. Verify `package.json` is correct
4. Try manual redeploy
5. Check Node.js version

### If emails go to spam:
1. Check sender address: `onboarding@resend.dev`
2. Verify email HTML formatting
3. Check Resend reputation
4. Add SPF/DKIM records (if custom domain)

---

## 📚 Resources

- Resend Docs: https://resend.com/docs
- API Reference: https://resend.com/docs/api-reference
- Render Docs: https://render.com/docs
- GitHub: https://github.com/resendlabs/resend-node

