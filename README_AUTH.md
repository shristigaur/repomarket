# RepoMarket - Dual Authentication System

Complete email/password + OAuth (Google & GitHub) authentication for your MERN stack marketplace.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [File Changes](#file-changes)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)

---

## ✨ Features

### Primary: Email/Password Authentication
- ✅ Signup with full name, email, password
- ✅ Login with email and password
- ✅ Secure password hashing (bcryptjs)
- ✅ JWT token generation (7-day expiry)
- ✅ Token storage in localStorage
- ✅ Input validation (frontend & backend)
- ✅ Clear error messages

### Secondary: OAuth Authentication
- ✅ Google Sign-In with account selection
- ✅ GitHub Sign-In with account selection
- ✅ Automatic user creation/update
- ✅ Fallback to email/password if OAuth fails
- ✅ Dynamic API URLs (no hardcoded localhost)

### Additional Features
- ✅ Email verification with OTP
- ✅ Protected routes with JWT middleware
- ✅ Optional auth for public endpoints
- ✅ Automatic redirect on 401
- ✅ User profile retrieval
- ✅ Logout with token clearing

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install bcryptjs

# Frontend (already has react-markdown)
cd frontend
npm install
```

### 2. Configure Environment Variables

**Backend** - Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-super-secret-key-min-32-chars
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Frontend** - Copy `frontend/.env.example` to `frontend/.env.local`:
```bash
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Test Authentication

- Visit `http://localhost:5173/signup` to create account
- Visit `http://localhost:5173/login` to log in
- Check localStorage for token: `localStorage.getItem('token')`

---

## 🏗️ Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                    │
├─────────────────────────────────────────────────────────────┤
│  Login.jsx / Signup.jsx                                     │
│  ├─ Email/Password Form                                    │
│  ├─ OAuth Buttons (Google/GitHub)                          │
│  └─ useAuth() Hook                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   BACKEND (Express/Node)                    │
├─────────────────────────────────────────────────────────────┤
│  routes/auth.js                                             │
│  ├─ POST /signup (email/password)                          │
│  ├─ POST /login (email/password)                           │
│  ├─ GET /google (OAuth)                                    │
│  ├─ GET /github (OAuth)                                    │
│  ├─ GET /me (protected)                                    │
│  └─ POST /logout                                           │
│                                                             │
│  middleware/auth.js                                         │
│  ├─ requireAuth (JWT verification)                         │
│  └─ signUser (JWT generation)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ MongoDB
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  DATABASE (MongoDB)                         │
├─────────────────────────────────────────────────────────────┤
│  User Collection                                            │
│  ├─ email (unique)                                         │
│  ├─ password (hashed with bcryptjs)                        │
│  ├─ googleId (unique, optional)                            │
│  ├─ githubId (unique, optional)                            │
│  ├─ name                                                   │
│  ├─ avatar                                                 │
│  └─ isEmailVerified                                        │
└─────────────────────────────────────────────────────────────┘
```

### Token Flow

```
Email/Password:
User → Form → POST /signup or /login → JWT Generated → localStorage → useAuth()

OAuth:
User → Click Button → GET /google or /github → Provider → Callback → JWT Generated → URL → localStorage → useAuth()
```

---

## 📁 File Changes

### Backend

| File | Change | Details |
|------|--------|---------|
| `models/User.js` | Updated | Added password field, bcrypt hashing, comparePassword() |
| `routes/auth.js` | Updated | Added signup, login, OAuth callbacks, /me endpoint |
| `package.json` | Updated | Added bcryptjs dependency |
| `.env.example` | Created | Environment variable template |

### Frontend

| File | Change | Details |
|------|--------|---------|
| `components/Login.jsx` | Created | Login form with OAuth buttons |
| `components/Signup.jsx` | Created | Signup form with OAuth buttons |
| `auth.js` | Updated | Simplified token storage, cleaned up code |
| `main.jsx` | Updated | Added /login and /signup routes |
| `.env.example` | Created | Environment variable template |

---

## ⚙️ Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (dev)
   - `https://your-render-domain.onrender.com/api/auth/google/callback` (prod)
6. Copy Client ID and Secret to `.env`

### GitHub OAuth Setup

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Create new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:5000/api/auth/github/callback` (dev)
   - `https://your-render-domain.onrender.com/api/auth/github/callback` (prod)
4. Copy Client ID and Secret to `.env`

### JWT Secret Generation

```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 Testing

### Manual Testing

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get Current User
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Browser Testing

1. Open DevTools → Application → LocalStorage
2. Check `token` key after login
3. Decode token: `atob(token.split('.')[1])`
4. Check expiry: `new Date(payload.exp * 1000)`

### OAuth Testing

1. Click "Sign in with Google/GitHub"
2. Authorize on provider's site
3. Check redirect URL for `?token=JWT`
4. Verify token stored in localStorage
5. Check user data in useAuth() hook

---

## 🚢 Deployment

### Backend (Render)

1. Push code to GitHub
2. Connect Render to GitHub repo
3. Create Web Service
4. Set environment variables:
   ```
   MONGODB_URI=...
   JWT_SECRET=...
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=https://your-render-domain.onrender.com/api/auth/google/callback
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   GITHUB_CALLBACK_URL=https://your-render-domain.onrender.com/api/auth/github/callback
   EMAIL_USER=...
   EMAIL_PASS=...
   ```
5. Deploy

### Frontend (Vercel)

1. Push code to GitHub
2. Connect Vercel to GitHub repo
3. Set environment variables:
   ```
   VITE_API_URL=https://your-render-domain.onrender.com/api
   ```
4. Deploy

### Update OAuth Providers

1. Google Cloud Console → Update redirect URIs
2. GitHub Settings → Update callback URL

---

## 📚 Documentation

### Main Guides

- **[AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md)** - Complete setup guide with OAuth configuration
- **[AUTH_API_REFERENCE.md](./AUTH_API_REFERENCE.md)** - API endpoints and usage examples
- **[AUTH_CODE_SNIPPETS.md](./AUTH_CODE_SNIPPETS.md)** - Code patterns and testing examples
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What was implemented and why

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | Register new user |
| POST | `/auth/login` | No | Login user |
| GET | `/auth/me` | Yes | Get current user |
| GET | `/auth/google` | No | Initiate Google OAuth |
| GET | `/auth/google/callback` | No | Google OAuth callback |
| GET | `/auth/github` | No | Initiate GitHub OAuth |
| GET | `/auth/github/callback` | No | GitHub OAuth callback |
| POST | `/auth/logout` | No | Logout user |
| POST | `/auth/send-otp` | Yes | Send OTP |
| POST | `/auth/verify-otp` | Yes | Verify OTP |

---

## 🔒 Security

- ✅ Passwords hashed with bcryptjs (10 salt rounds)
- ✅ JWT tokens expire in 7 days
- ✅ HTTPS enforced in production
- ✅ CORS configured for frontend domain
- ✅ Input validation on all endpoints
- ✅ Sensitive fields excluded from responses
- ✅ OAuth credentials in .env (never in code)
- ✅ Rate limiting recommended on auth endpoints

---

## 🐛 Troubleshooting

### "Invalid email or password"
- Check email is registered
- Verify password is correct
- Check database connection

### OAuth redirect fails
- Verify callback URLs in OAuth provider settings
- Check FRONTEND_URL in backend .env
- Ensure OAuth credentials are correct

### Token not persisting
- Check localStorage is enabled
- Verify token is being set: `localStorage.getItem('token')`
- Check JWT_SECRET is consistent

### CORS errors
- Verify backend CORS is configured
- Check `Access-Control-Allow-Origin` header
- Ensure frontend URL matches CORS config

---

## 📞 Support

For issues:
1. Check [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md)
2. Review [AUTH_API_REFERENCE.md](./AUTH_API_REFERENCE.md)
3. Check [AUTH_CODE_SNIPPETS.md](./AUTH_CODE_SNIPPETS.md)
4. Review backend logs: `npm run dev`
5. Check browser console for frontend errors

---

## 📦 Dependencies

### Backend
- `express@^5.1.0` - Web framework
- `mongoose@^8.13.2` - MongoDB ODM
- `jsonwebtoken@^9.0.3` - JWT generation
- `bcryptjs@^2.4.3` - Password hashing
- `passport@^0.7.0` - OAuth
- `passport-google-oauth20@^2.0.0` - Google OAuth
- `passport-github2@^0.1.12` - GitHub OAuth

### Frontend
- `react@^19.1.0` - UI library
- `vite@^6.2.5` - Build tool
- `react-markdown@^10.1.0` - Markdown rendering
- `lucide-react@^1.47.0` - Icons

---

## 📝 License

This authentication system is part of the RepoMarket project.

---

## ✅ Checklist

- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Test signup/login locally
- [ ] Test OAuth locally
- [ ] Set up Google OAuth credentials
- [ ] Set up GitHub OAuth credentials
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] Update OAuth callback URLs
- [ ] Test end-to-end on production
- [ ] Monitor logs for errors
- [ ] Set up email verification (optional)

---

**Status:** ✅ Production Ready

**Last Updated:** 2024

**Version:** 1.0.0
