# Authentication API Quick Reference

## Email/Password Authentication

### Sign Up
```
POST /api/auth/signup
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response: 201 Created
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  }
}
```

### Log In
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  }
}
```

### Get Current User
```
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": null,
  "isEmailVerified": false
}
```

### Log Out
```
POST /api/auth/logout

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

---

## OAuth Authentication

### Google Sign In
```
GET /api/auth/google?prompt=select_account

Redirects to Google login → Redirects back to:
http://localhost:5173?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### GitHub Sign In
```
GET /api/auth/github?prompt=select_account

Redirects to GitHub login → Redirects back to:
http://localhost:5173?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Email Verification (OTP)

### Send OTP
```
POST /api/auth/send-otp
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
{
  "message": "Verification code sent."
}
```

### Verify OTP
```
POST /api/auth/verify-otp
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}

Response: 200 OK
{
  "message": "Email verified successfully.",
  "isEmailVerified": true
}
```

---

## Frontend Usage

### Using useAuth Hook
```javascript
import { useAuth } from '../auth';

function MyComponent() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <a href="/login">Sign in</a>;
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}
```

### Making Authenticated Requests
```javascript
import { authHeaders, API_BASE_URL } from '../auth';

async function fetchUserListings() {
  const response = await fetch(`${API_BASE_URL}/listings/my`, {
    headers: authHeaders()
  });
  return response.json();
}
```

### Storing Token After Login
```javascript
// Token is automatically stored in localStorage
localStorage.setItem('token', data.token);

// Retrieve token
const token = localStorage.getItem('token');

// Clear token on logout
localStorage.removeItem('token');
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Full name, email, and password are required."
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid email or password."
}
```

### 409 Conflict
```json
{
  "error": "An account with this email already exists."
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create account."
}
```

---

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-secret-key-min-32-chars
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

---

## Token Format

JWT tokens contain:
- **Header**: Algorithm (HS256) and type (JWT)
- **Payload**: User ID (sub) and role
- **Signature**: HMAC-SHA256 signed with JWT_SECRET

Example payload:
```json
{
  "sub": "507f1f77bcf86cd799439011",
  "role": "BUYER",
  "iat": 1704067200,
  "exp": 1704672000
}
```

Token expires in 7 days by default.

---

## Testing Checklist

- [ ] Signup with email/password
- [ ] Login with email/password
- [ ] Invalid credentials rejected
- [ ] Duplicate email rejected
- [ ] Token stored in localStorage
- [ ] useAuth hook retrieves user data
- [ ] Protected endpoints require token
- [ ] Google OAuth flow works
- [ ] GitHub OAuth flow works
- [ ] Logout clears token
- [ ] Redirect to login on 401
- [ ] OTP sent to email
- [ ] OTP verification works
