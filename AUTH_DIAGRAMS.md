# Authentication System - Visual Diagrams

## 1. Email/Password Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER SIGNUP                                 │
└─────────────────────────────────────────────────────────────────────┘

1. User visits /signup
   ↓
2. Fills form: Full Name, Email, Password
   ↓
3. Clicks "Create account"
   ↓
4. Frontend validates input
   ├─ Full name not empty
   ├─ Valid email format
   └─ Password >= 6 characters
   ↓
5. POST /api/auth/signup
   {
     "fullName": "John Doe",
     "email": "john@example.com",
     "password": "password123"
   }
   ↓
6. Backend validates input
   ├─ Check all fields present
   ├─ Check email format
   ├─ Check password length
   └─ Check email not already registered
   ↓
7. Hash password with bcryptjs
   ↓
8. Create user in MongoDB
   ↓
9. Generate JWT token
   {
     "sub": "507f1f77bcf86cd799439011",
     "role": "BUYER",
     "iat": 1704067200,
     "exp": 1704672000
   }
   ↓
10. Return token + user data
    {
      "token": "eyJhbGc...",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": null
      }
    }
    ↓
11. Frontend stores token in localStorage
    localStorage.setItem('token', token)
    ↓
12. Frontend redirects to /
    ↓
13. useAuth() hook fetches /api/auth/me
    ↓
14. User is now authenticated ✓


┌─────────────────────────────────────────────────────────────────────┐
│                         USER LOGIN                                  │
└─────────────────────────────────────────────────────────────────────┘

1. User visits /login
   ↓
2. Fills form: Email, Password
   ↓
3. Clicks "Sign in"
   ↓
4. Frontend validates input
   ├─ Email not empty
   └─ Password not empty
   ↓
5. POST /api/auth/login
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ↓
6. Backend finds user by email
   ├─ User not found → 401 "Invalid credentials"
   └─ User found → continue
   ↓
7. Compare provided password with hashed password
   ├─ Password invalid → 401 "Invalid credentials"
   └─ Password valid → continue
   ↓
8. Generate JWT token
   ↓
9. Return token + user data
   ↓
10. Frontend stores token in localStorage
    ↓
11. Frontend redirects to /
    ↓
12. useAuth() hook fetches /api/auth/me
    ↓
13. User is now authenticated ✓
```

---

## 2. OAuth Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

1. User visits /login or /signup
   ↓
2. Clicks "Sign in with Google"
   ↓
3. Frontend redirects to:
   GET /api/auth/google?prompt=select_account
   ↓
4. Backend initiates OAuth flow
   ├─ Redirects to Google login
   └─ Includes client_id, redirect_uri, scope
   ↓
5. User sees Google login page
   ↓
6. User enters Google credentials
   ↓
7. User selects account (if multiple)
   ↓
8. User grants permissions
   ├─ profile
   └─ email
   ↓
9. Google redirects to callback URL with auth code:
   GET /api/auth/google/callback?code=AUTH_CODE&state=STATE
   ↓
10. Backend exchanges code for access token
    ├─ Calls Google API
    └─ Gets user profile (id, name, email, avatar)
    ↓
11. Backend checks if user exists
    ├─ User exists → Update user
    └─ User not exists → Create new user
    ↓
12. User document in MongoDB:
    {
      "_id": "507f1f77bcf86cd799439011",
      "googleId": "118364144313...",
      "email": "john@gmail.com",
      "name": "John Doe",
      "avatar": "https://...",
      "password": null,
      "role": "BUYER"
    }
    ↓
13. Backend generates JWT token
    ↓
14. Backend redirects to frontend with token:
    GET http://localhost:5173?token=eyJhbGc...
    ↓
15. Frontend extracts token from URL
    const token = new URLSearchParams(window.location.search).get('token')
    ↓
16. Frontend stores token in localStorage
    localStorage.setItem('token', token)
    ↓
17. Frontend clears URL
    window.history.replaceState({}, document.title, window.location.pathname)
    ↓
18. Frontend redirects to /
    ↓
19. useAuth() hook fetches /api/auth/me
    ↓
20. User is now authenticated ✓


┌─────────────────────────────────────────────────────────────────────┐
│                    GITHUB OAUTH FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

Same as Google, but:
- Endpoint: /api/auth/github
- Callback: /api/auth/github/callback
- Scope: user:email
- User ID field: githubId
```

---

## 3. Protected Route Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│              ACCESSING PROTECTED ENDPOINT                           │
└─────────────────────────────────────────────────────────────────────┘

1. Frontend makes request to protected endpoint
   GET /api/listings/my
   Headers: {
     "Authorization": "Bearer eyJhbGc..."
   }
   ↓
2. Backend receives request
   ↓
3. Middleware: requireAuth
   ├─ Extract token from Authorization header
   ├─ Verify token signature with JWT_SECRET
   ├─ Check token not expired
   ├─ Decode token to get user ID
   └─ Fetch user from database
   ↓
4. Token valid?
   ├─ NO → Return 401 "Authentication is required."
   └─ YES → Continue
   ↓
5. req.user is now set to user document
   ↓
6. Route handler executes
   const listings = await Listing.find({ userId: req.user._id })
   ↓
7. Return response
   ↓
8. Frontend receives data
   ↓
9. If 401 → Redirect to /login
   ↓
10. If 200 → Display data ✓


┌─────────────────────────────────────────────────────────────────────┐
│              OPTIONAL AUTH FLOW                                     │
└─────────────────────────────────────────────────────────────────────┘

1. Frontend makes request (with or without token)
   GET /api/listings
   Headers: {
     "Authorization": "Bearer eyJhbGc..." (optional)
   }
   ↓
2. Backend receives request
   ↓
3. Middleware: optionalAuth
   ├─ Try to extract token
   ├─ Try to verify token
   └─ If valid → Set req.user
   └─ If invalid → Continue without req.user
   ↓
4. Route handler executes
   if (req.user) {
     // Show public + private listings
   } else {
     // Show only public listings
   }
   ↓
5. Return response ✓
```

---

## 4. Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TOKEN LIFECYCLE                                  │
└─────────────────────────────────────────────────────────────────────┘

GENERATION:
  User logs in/signs up
  ↓
  Backend calls signUser(user)
  ↓
  JWT generated with:
  - sub: user._id
  - role: user.role
  - iat: current timestamp
  - exp: current timestamp + 7 days
  ↓
  Token returned to frontend

STORAGE:
  Frontend receives token
  ↓
  localStorage.setItem('token', token)
  ↓
  Token persists across page refreshes

USAGE:
  Frontend makes API request
  ↓
  Adds token to Authorization header
  ↓
  Backend verifies token
  ↓
  Request processed

EXPIRY:
  Token created at: 2024-01-01 00:00:00
  ↓
  Token expires at: 2024-01-08 00:00:00 (7 days later)
  ↓
  After expiry:
  - jwt.verify() throws error
  - Backend returns 401
  - Frontend redirects to /login
  - User must log in again

REFRESH (Optional):
  User still on page when token expires
  ↓
  Next API call fails with 401
  ↓
  Frontend redirects to /login
  ↓
  User logs in again
  ↓
  New token generated

LOGOUT:
  User clicks logout
  ↓
  Frontend clears localStorage
  localStorage.removeItem('token')
  ↓
  Frontend redirects to /
  ↓
  useAuth() hook detects no token
  ↓
  User is logged out ✓
```

---

## 5. User Model Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER DOCUMENT                                    │
└─────────────────────────────────────────────────────────────────────┘

{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  
  // Email/Password Auth
  "email": "john@example.com",
  "password": "$2a$10$...", // bcryptjs hash
  
  // OAuth
  "googleId": "118364144313...", // Optional
  "githubId": "12345678",        // Optional
  
  // User Info
  "name": "John Doe",
  "avatar": "https://...",
  
  // Email Verification
  "isEmailVerified": false,
  "emailOtp": "...", // Hidden by default (select: false)
  "otpExpiresAt": ISODate("2024-01-01T00:10:00Z"), // Hidden by default
  
  // Role
  "role": "BUYER", // or "SELLER"
  
  // Ratings
  "averageRating": 4.5,
  "totalReviews": 12,
  
  // Timestamps
  "createdAt": ISODate("2024-01-01T00:00:00Z"),
  "updatedAt": ISODate("2024-01-01T00:00:00Z")
}

NOTES:
- Either password OR (googleId/githubId) must be present
- password is hidden by default (select: false)
- emailOtp and otpExpiresAt are hidden by default
- email is unique and lowercase
- googleId and githubId are unique and sparse
```

---

## 6. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                                   │
└─────────────────────────────────────────────────────────────────────┘

SIGNUP ERRORS:

Missing fields
  ↓
  400 Bad Request
  "Full name, email, and password are required."

Invalid email format
  ↓
  400 Bad Request
  "Please provide a valid email address."

Password too short
  ↓
  400 Bad Request
  "Password must be at least 6 characters long."

Email already exists
  ↓
  409 Conflict
  "An account with this email already exists."

Database error
  ↓
  500 Internal Server Error
  "Failed to create account."


LOGIN ERRORS:

Missing fields
  ↓
  400 Bad Request
  "Email and password are required."

User not found
  ↓
  401 Unauthorized
  "Invalid email or password."

Password incorrect
  ↓
  401 Unauthorized
  "Invalid email or password."

Database error
  ↓
  500 Internal Server Error
  "Failed to log in."


PROTECTED ENDPOINT ERRORS:

No token provided
  ↓
  401 Unauthorized
  "Authentication is required."

Invalid token
  ↓
  401 Unauthorized
  "Authentication is required."

Token expired
  ↓
  401 Unauthorized
  "Authentication is required."

User not found
  ↓
  401 Unauthorized
  "Authentication is required."


FRONTEND ERROR HANDLING:

Error received
  ↓
  Display error message to user
  ↓
  If 401 → Redirect to /login
  ↓
  If 400 → Show validation error
  ↓
  If 500 → Show generic error
```

---

## 7. Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT TREE                                   │
└─────────────────────────────────────────────────────────────────────┘

App (main.jsx)
├─ / → MarketplaceDashboard
├─ /login → Login
│  ├─ Email input
│  ├─ Password input
│  ├─ Submit button
│  ├─ OAuth divider
│  ├─ Google button
│  ├─ GitHub button
│  └─ Link to signup
├─ /signup → Signup
│  ├─ Full name input
│  ├─ Email input
│  ├─ Password input
│  ├─ Submit button
│  ├─ OAuth divider
│  ├─ Google button
│  ├─ GitHub button
│  └─ Link to login
├─ /create → ListingCreation
├─ /my-listings → MyListings
│  └─ Uses useAuth() to get user
└─ /auth/callback → AuthCallback

useAuth() Hook (auth.js)
├─ Extracts token from URL
├─ Stores token in localStorage
├─ Fetches user from /api/auth/me
├─ Returns { user, loading, signOut }
└─ Used by all components that need auth
```

---

## 8. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                            │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND (Vercel)
├─ Domain: your-app.vercel.app
├─ Environment: VITE_API_URL=https://api.your-app.onrender.com/api
├─ Deployed from: GitHub
└─ Auto-deploys on push

BACKEND (Render)
├─ Domain: api.your-app.onrender.com
├─ Environment:
│  ├─ DATABASE_URL=mongodb+srv://...
│  ├─ JWT_SECRET=...
│  ├─ FRONTEND_URL=https://your-app.vercel.app
│  ├─ GOOGLE_CALLBACK_URL=https://api.your-app.onrender.com/api/auth/google/callback
│  └─ GITHUB_CALLBACK_URL=https://api.your-app.onrender.com/api/auth/github/callback
├─ Deployed from: GitHub
└─ Auto-deploys on push

DATABASE (MongoDB Atlas)
├─ Cluster: your-cluster.mongodb.net
├─ Database: repomarket
├─ Collections:
│  ├─ users
│  ├─ listings
│  └─ ratings
└─ IP Whitelist: 0.0.0.0/0 (or Render IP)

OAUTH PROVIDERS
├─ Google Cloud Console
│  └─ Redirect URI: https://api.your-app.onrender.com/api/auth/google/callback
└─ GitHub Settings
   └─ Callback URL: https://api.your-app.onrender.com/api/auth/github/callback

FLOW:
User → Vercel Frontend → Render Backend → MongoDB Atlas
                              ↓
                         OAuth Providers
```

---

## 9. Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                                  │
└─────────────────────────────────────────────────────────────────────┘

LAYER 1: Input Validation
├─ Frontend: Check email format, password length
└─ Backend: Validate all inputs before processing

LAYER 2: Password Security
├─ Frontend: Require min 6 characters
└─ Backend: Hash with bcryptjs (10 salt rounds)

LAYER 3: JWT Security
├─ Secret: Strong random string (32+ chars)
├─ Expiry: 7 days
└─ Signature: HMAC-SHA256

LAYER 4: HTTPS
├─ Frontend: Served over HTTPS (Vercel)
└─ Backend: Served over HTTPS (Render)

LAYER 5: CORS
├─ Backend: Allow only frontend domain
└─ Prevent cross-origin attacks

LAYER 6: Rate Limiting (Optional)
├─ Limit signup attempts
├─ Limit login attempts
└─ Prevent brute force

LAYER 7: OAuth Security
├─ Account selection prompt
├─ Secure redirect URIs
└─ Client secret never exposed

LAYER 8: Database Security
├─ MongoDB Atlas IP whitelist
├─ Unique indexes on email/googleId/githubId
└─ Passwords never logged
```

---

## 10. Testing Scenarios

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TEST SCENARIOS                                   │
└─────────────────────────────────────────────────────────────────────┘

SIGNUP TESTS:
✓ Valid signup creates user and returns token
✓ Duplicate email rejected
✓ Missing fields rejected
✓ Invalid email rejected
✓ Short password rejected
✓ Token stored in localStorage
✓ User redirected to home

LOGIN TESTS:
✓ Valid login returns token
✓ Invalid email rejected
✓ Invalid password rejected
✓ Token stored in localStorage
✓ User redirected to home

OAUTH TESTS:
✓ Google OAuth flow works
✓ GitHub OAuth flow works
✓ User created on first OAuth
✓ User updated on subsequent OAuth
✓ Token extracted from URL
✓ Token stored in localStorage

PROTECTED ROUTE TESTS:
✓ Authenticated user can access
✓ Unauthenticated user redirected
✓ Invalid token rejected
✓ Expired token rejected

LOGOUT TESTS:
✓ Token cleared from localStorage
✓ User state reset
✓ User redirected to home
✓ Protected routes inaccessible

EMAIL VERIFICATION TESTS:
✓ OTP sent to email
✓ OTP verified successfully
✓ Invalid OTP rejected
✓ Expired OTP rejected
```

---

This visual guide should help you understand the complete authentication flow!
