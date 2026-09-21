# Deployment Checklist - Dual Authentication System

## Pre-Deployment (Local Testing)

### Backend Testing
- [ ] `npm install bcryptjs` completed
- [ ] `.env` file created with all variables
- [ ] `npm run dev` starts without errors
- [ ] MongoDB connection successful
- [ ] `POST /api/auth/signup` works
- [ ] `POST /api/auth/login` works
- [ ] `GET /api/auth/me` works with token
- [ ] `GET /api/auth/google` redirects to Google
- [ ] `GET /api/auth/github` redirects to GitHub
- [ ] `POST /api/auth/logout` works
- [ ] Error handling works (invalid email, duplicate email, etc.)

### Frontend Testing
- [ ] `.env.local` created with VITE_API_URL
- [ ] `npm run dev` starts without errors
- [ ] `/login` page loads
- [ ] `/signup` page loads
- [ ] Signup form validation works
- [ ] Login form validation works
- [ ] Signup creates account and stores token
- [ ] Login authenticates and stores token
- [ ] Token persists in localStorage
- [ ] useAuth() hook retrieves user data
- [ ] Logout clears token
- [ ] OAuth buttons link to correct endpoints

### OAuth Testing
- [ ] Google OAuth credentials obtained
- [ ] GitHub OAuth credentials obtained
- [ ] Google OAuth flow works end-to-end
- [ ] GitHub OAuth flow works end-to-end
- [ ] User created in database after OAuth
- [ ] Token extracted from URL after OAuth
- [ ] Token stored in localStorage after OAuth

### Integration Testing
- [ ] Signup → Login → Logout flow works
- [ ] OAuth → Logout flow works
- [ ] Protected routes require token
- [ ] Invalid token rejected
- [ ] Expired token rejected
- [ ] CORS errors resolved

---

## Backend Deployment (Render)

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] All tests passing locally
- [ ] No console errors
- [ ] No hardcoded credentials in code
- [ ] `.env` file NOT committed to git

### Render Setup
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] New Web Service created
- [ ] Build command: `npm install`
- [ ] Start command: `node server.js`
- [ ] Environment variables set:

```
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-super-secret-key-min-32-chars
FRONTEND_URL=https://your-vercel-domain.vercel.app
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=https://your-render-domain.onrender.com/api/auth/google/callback
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_CALLBACK_URL=https://your-render-domain.onrender.com/api/auth/github/callback
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=5000
NODE_ENV=production
```

### Post-Deployment
- [ ] Deployment successful (no errors)
- [ ] Backend URL accessible
- [ ] Health check endpoint works
- [ ] MongoDB connection successful
- [ ] Logs show no errors
- [ ] Test signup endpoint: `curl -X POST https://your-render-domain.onrender.com/api/auth/signup ...`
- [ ] Test login endpoint
- [ ] Test /me endpoint with token

### Monitoring
- [ ] Set up error alerts
- [ ] Monitor logs for errors
- [ ] Check database connection status
- [ ] Monitor API response times

---

## Frontend Deployment (Vercel)

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] All tests passing locally
- [ ] No console errors
- [ ] Build succeeds: `npm run build`
- [ ] Preview works: `npm run preview`

### Vercel Setup
- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] New project created
- [ ] Framework: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables set:

```
VITE_API_URL=https://your-render-domain.onrender.com/api
```

### Post-Deployment
- [ ] Deployment successful (no errors)
- [ ] Frontend URL accessible
- [ ] Pages load without errors
- [ ] `/login` page works
- [ ] `/signup` page works
- [ ] Forms submit to correct backend URL
- [ ] OAuth buttons link to correct backend URLs
- [ ] Token stored in localStorage
- [ ] useAuth() hook works

### Monitoring
- [ ] Set up error alerts
- [ ] Monitor build logs
- [ ] Check for 404 errors
- [ ] Monitor API calls in browser console

---

## OAuth Provider Configuration

### Google Cloud Console

- [ ] Project created
- [ ] Google+ API enabled
- [ ] OAuth 2.0 credentials created (Web application)
- [ ] Authorized redirect URIs updated:
  - [ ] `http://localhost:5000/api/auth/google/callback` (dev)
  - [ ] `https://your-render-domain.onrender.com/api/auth/google/callback` (prod)
- [ ] Client ID copied to backend .env
- [ ] Client Secret copied to backend .env
- [ ] Credentials NOT committed to git

### GitHub Settings

- [ ] OAuth App created
- [ ] Authorization callback URL updated:
  - [ ] `http://localhost:5000/api/auth/github/callback` (dev)
  - [ ] `https://your-render-domain.onrender.com/api/auth/github/callback` (prod)
- [ ] Client ID copied to backend .env
- [ ] Client Secret copied to backend .env
- [ ] Credentials NOT committed to git

---

## MongoDB Atlas Configuration

### Database Setup
- [ ] MongoDB Atlas account created
- [ ] Cluster created
- [ ] Database created: `repomarket`
- [ ] Collections created:
  - [ ] `users`
  - [ ] `listings`
  - [ ] `ratings`

### Security
- [ ] IP Whitelist configured:
  - [ ] `127.0.0.1` (local development)
  - [ ] `0.0.0.0/0` (allow all - for Render)
  - [ ] Or specific Render IP range
- [ ] Database user created with strong password
- [ ] Connection string copied to backend .env
- [ ] Connection string NOT committed to git

### Indexes
- [ ] `users.email` - unique index
- [ ] `users.googleId` - unique, sparse index
- [ ] `users.githubId` - unique, sparse index
- [ ] `listings.userId` - index
- [ ] `ratings.userId` - index

---

## Production Testing

### Signup/Login
- [ ] Signup with email/password works
- [ ] Login with email/password works
- [ ] Invalid credentials rejected
- [ ] Duplicate email rejected
- [ ] Token stored in localStorage
- [ ] User data retrieved from /me endpoint
- [ ] Logout clears token

### OAuth
- [ ] Google OAuth flow works
- [ ] GitHub OAuth flow works
- [ ] User created in database
- [ ] Token extracted from URL
- [ ] Token stored in localStorage
- [ ] User data retrieved from /me endpoint

### Protected Routes
- [ ] Authenticated user can access protected endpoints
- [ ] Unauthenticated user redirected to login
- [ ] Invalid token rejected
- [ ] Expired token rejected

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Invalid responses handled
- [ ] Timeout errors handled
- [ ] CORS errors resolved

### Performance
- [ ] Signup completes in < 2 seconds
- [ ] Login completes in < 2 seconds
- [ ] OAuth flow completes in < 5 seconds
- [ ] API responses < 500ms
- [ ] Frontend loads in < 3 seconds

### Security
- [ ] HTTPS enforced
- [ ] No credentials in localStorage (except token)
- [ ] No credentials in URL
- [ ] No credentials in console logs
- [ ] CORS configured correctly
- [ ] Rate limiting working (if implemented)

---

## Post-Deployment

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up performance monitoring
- [ ] Set up uptime monitoring
- [ ] Set up log aggregation
- [ ] Set up alerts for errors

### Maintenance
- [ ] Document deployment process
- [ ] Document rollback procedure
- [ ] Set up automated backups
- [ ] Set up database monitoring
- [ ] Plan for scaling

### Documentation
- [ ] Update README with production URLs
- [ ] Document environment variables
- [ ] Document deployment steps
- [ ] Document troubleshooting guide
- [ ] Document API endpoints

### Team Communication
- [ ] Notify team of deployment
- [ ] Share production URLs
- [ ] Share monitoring dashboards
- [ ] Share troubleshooting guide
- [ ] Schedule post-deployment review

---

## Rollback Plan

### If Deployment Fails

1. **Backend Rollback**
   - [ ] Render: Revert to previous deployment
   - [ ] Check logs for errors
   - [ ] Fix issues locally
   - [ ] Redeploy

2. **Frontend Rollback**
   - [ ] Vercel: Revert to previous deployment
   - [ ] Check logs for errors
   - [ ] Fix issues locally
   - [ ] Redeploy

3. **Database Rollback**
   - [ ] MongoDB: Restore from backup
   - [ ] Verify data integrity
   - [ ] Test queries

### If Issues Arise Post-Deployment

1. **Check Logs**
   - [ ] Backend logs (Render)
   - [ ] Frontend logs (browser console)
   - [ ] Database logs (MongoDB)

2. **Common Issues**
   - [ ] CORS errors → Check backend CORS config
   - [ ] 401 errors → Check JWT_SECRET, token expiry
   - [ ] 404 errors → Check API URLs
   - [ ] Database errors → Check MongoDB connection
   - [ ] OAuth errors → Check callback URLs

3. **Escalation**
   - [ ] Contact Render support
   - [ ] Contact Vercel support
   - [ ] Contact MongoDB support

---

## Verification Checklist

### Before Going Live
- [ ] All tests passing
- [ ] No console errors
- [ ] No network errors
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete
- [ ] Team trained
- [ ] Monitoring set up
- [ ] Backup plan ready

### After Going Live
- [ ] Monitor for errors
- [ ] Monitor performance
- [ ] Monitor user feedback
- [ ] Check analytics
- [ ] Verify all features working
- [ ] Verify OAuth flows
- [ ] Verify email verification
- [ ] Verify protected routes

---

## Sign-Off

- [ ] Backend deployed and tested: _________________ Date: _______
- [ ] Frontend deployed and tested: _________________ Date: _______
- [ ] OAuth configured and tested: _________________ Date: _______
- [ ] Production testing complete: _________________ Date: _______
- [ ] Monitoring set up: _________________ Date: _______
- [ ] Team trained: _________________ Date: _______
- [ ] Ready for production: _________________ Date: _______

---

## Contact Information

### Support Contacts
- Backend Issues: Render Support
- Frontend Issues: Vercel Support
- Database Issues: MongoDB Support
- OAuth Issues: Google/GitHub Support

### Team Contacts
- Backend Lead: _________________
- Frontend Lead: _________________
- DevOps Lead: _________________
- Project Manager: _________________

---

## Notes

```
[Space for deployment notes]
```

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Approved By**: _______________

**Status**: ✅ Ready for Production

---

**Good luck with your deployment! 🚀**
