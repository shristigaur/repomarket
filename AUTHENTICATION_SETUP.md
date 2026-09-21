# Dual Authentication System Setup Guide

## Overview
This guide covers the complete email/password + OAuth (Google & GitHub) authentication system for your MERN stack application.

---

## BACKEND SETUP

### 1. Install Dependencies
```bash
cd backend
npm install bcryptjs
```

### 2. Environment Variables (.env)
Add these to your backend `.env` file:

```env
# Database
DATABASE_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173
# For production:
# FRONTEND_URL=https://your-vercel-domain.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
# For production:
# GOOGLE_CALLBACK_URL=https://your-render-domain.onrender.com/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
# For production:
# GITHUB_CALLBACK_URL=https://your-render-domain.onrender.com/api/auth/github/callback

# Email (for OTP verification)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-specific-password
```

### 3. Files Modified/Created

**models/User.js** - Updated with:
- `password` field (optional, for email/password auth)
- `bcrypt` hashing on save
- `comparePassword()` method

**routes/auth.js** - New endpoints:
- `POST /api/auth/signup` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user (requires JWT)
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `POST /api/auth/logout` - Clear auth cookies
- `POST /api/auth/send-otp` - Send OTP for email verification
- `POST /api/auth/verify-otp` - Verify OTP

**middleware/auth.js** - Already has:
- `requireAuth` - JWT verification middleware
- `signUser()` - JWT token generation
- `optionalAuth` - Optional JWT verification

### 4. Test Backend Endpoints

**Signup:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get Current User:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## FRONTEND SETUP

### 1. Environment Variables (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
# For production:
# VITE_API_URL=https://your-render-domain.onrender.com/api
```

### 2. Files Created

**src/components/Login.jsx** - Login page with:
- Email & password form
- Form validation & error handling
- Loading state
- OAuth buttons (Google & GitHub)
- Link to signup page

**src/components/Signup.jsx** - Signup page with:
- Full name, email, password form
- Form validation & error handling
- Loading state
- OAuth buttons (Google & GitHub)
- Link to login page

### 3. Files Modified

**src/auth.js** - Updated to:
- Use single `token` localStorage key
- Simplified token retrieval
- Clean up legacy code

**src/main.jsx** - Added routes:
- `/login` → Login component
- `/signup` → Signup component

### 4. Test Frontend

1. Start frontend dev server:
```bash
cd frontend
npm run dev
```

2. Visit `http://localhost:5173/signup` to create an account
3. Visit `http://localhost:5173/login` to log in
4. Token is automatically stored in localStorage
5. Redirect to home page on successful auth

---

## OAUTH SETUP

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (dev)
   - `https://your-render-domain.onrender.com/api/auth/google/callback` (prod)
6. Copy Client ID and Client Secret to `.env`

### GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:5000/api/auth/google/callback` (dev)
   - `https://your-render-domain.onrender.com/api/auth/github/callback` (prod)
4. Copy Client ID and Client Secret to `.env`

---

## AUTHENTICATION FLOW

### Email/Password Flow
1. User fills signup/login form
2. Frontend sends POST to `/api/auth/signup` or `/api/auth/login`
3. Backend validates, hashes password (signup), compares password (login)
4. Backend returns JWT token
5. Frontend stores token in localStorage
6. Frontend redirects to home page
7. `useAuth()` hook fetches user data from `/api/auth/me`

### OAuth Flow
1. User clicks "Sign in with Google/GitHub"
2. Frontend redirects to `/api/auth/google` or `/api/auth/github`
3. Backend initiates OAuth flow with provider
4. User authorizes on provider's site
5. Provider redirects to callback URL with auth code
6. Backend exchanges code for user profile
7. Backend creates/updates user in database
8. Backend generates JWT token
9. Backend redirects to frontend with token in URL: `?token=JWT_TOKEN`
10. Frontend's `useAuth()` hook extracts token from URL
11. Frontend stores token in localStorage
12. Frontend fetches user data from `/api/auth/me`

---

## DEPLOYMENT

### Backend (Render)

1. Push code to GitHub
2. Connect Render to GitHub repo
3. Create new Web Service
4. Set environment variables in Render dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL` (your Vercel domain)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
   - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
   - `EMAIL_USER`, `EMAIL_PASS`
5. Deploy

### Frontend (Vercel)

1. Push code to GitHub
2. Connect Vercel to GitHub repo
3. Set environment variables:
   - `VITE_API_URL=https://your-render-domain.onrender.com/api`
4. Deploy

---

## SECURITY BEST PRACTICES

1. **JWT Secret**: Use a strong, random string (min 32 characters)
2. **Password Hashing**: bcryptjs with 10 salt rounds (default)
3. **HTTPS Only**: Always use HTTPS in production
4. **Secure Cookies**: Set `HttpOnly`, `Secure`, `SameSite` flags
5. **CORS**: Configure CORS to allow only your frontend domain
6. **Rate Limiting**: Add rate limiting to auth endpoints
7. **Input Validation**: All inputs are validated on backend
8. **Token Expiry**: JWT tokens expire in 7 days (configurable)

---

## TROUBLESHOOTING

### "Invalid email or password"
- Check email is registered
- Verify password is correct
- Check database connection

### OAuth redirect fails
- Verify callback URLs match in OAuth provider settings
- Check `FRONTEND_URL` and `GOOGLE_CALLBACK_URL`/`GITHUB_CALLBACK_URL` in `.env`
- Ensure OAuth credentials are correct

### Token not persisting
- Check localStorage is enabled in browser
- Verify token is being set: `localStorage.getItem('token')`
- Check JWT_SECRET is consistent between sessions

### CORS errors
- Verify backend CORS is configured for frontend domain
- Check `Access-Control-Allow-Origin` header

---

## API REFERENCE

### POST /api/auth/signup
**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  }
}
```

### POST /api/auth/login
**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  }
}
```

### GET /api/auth/me
**Headers:**
```
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": null,
  "isEmailVerified": false
}
```

---

## Next Steps

1. Test signup/login locally
2. Test OAuth flows locally
3. Deploy backend to Render
4. Deploy frontend to Vercel
5. Test end-to-end on production
6. Monitor logs for errors
7. Set up email verification flow (optional)
