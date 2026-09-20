# Authentication Code Snippets

## Frontend Patterns

### Protected Route Component
```javascript
import { useAuth } from '../auth';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
}

// Usage:
// <ProtectedRoute>
//   <MyListings />
// </ProtectedRoute>
```

### Conditional Navbar
```javascript
import { useAuth } from '../auth';

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav>
      {user ? (
        <>
          <span>Welcome, {user.name}</span>
          <button onClick={signOut}>Sign out</button>
        </>
      ) : (
        <>
          <a href="/login">Sign in</a>
          <a href="/signup">Sign up</a>
        </>
      )}
    </nav>
  );
}
```

### API Call with Auth
```javascript
import { authHeaders, API_BASE_URL } from '../auth';

async function createListing(data) {
  const response = await fetch(`${API_BASE_URL}/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify(data)
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  return response.json();
}
```

### Form with Loading State
```javascript
import { useState } from 'react';
import { Loader } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      localStorage.setItem('token', data.token);
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader className="animate-spin" size={18} />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
}
```

---

## Backend Patterns

### Protected Route Middleware
```javascript
const { requireAuth } = require('../middleware/auth');

// Apply to routes that need authentication
router.get('/my-listings', requireAuth, async (req, res) => {
  // req.user is now available
  const listings = await Listing.find({ userId: req.user._id });
  res.json(listings);
});
```

### Optional Auth Middleware
```javascript
const { optionalAuth } = require('../middleware/auth');

// Apply to routes that work with or without auth
router.get('/listings', optionalAuth, async (req, res) => {
  let query = {};
  
  // If user is authenticated, show their private listings too
  if (req.user) {
    query = { $or: [{ isPublic: true }, { userId: req.user._id }] };
  } else {
    query = { isPublic: true };
  }

  const listings = await Listing.find(query);
  res.json(listings);
});
```

### Custom Auth Middleware
```javascript
const jwt = require('jsonwebtoken');

async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Token required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Usage:
router.delete('/users/:id', requireAdmin, async (req, res) => {
  // Only admins can delete users
});
```

### Error Handling
```javascript
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = signUser(user);
    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});
```

### Async Error Wrapper
```javascript
// Wrap async route handlers to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage:
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // ... no need for try/catch
}));
```

---

## Testing

### Jest Test Example
```javascript
describe('Authentication', () => {
  it('should signup a new user', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('john@example.com');
  });

  it('should reject duplicate email', async () => {
    await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed'
    });

    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        fullName: 'Jane Doe',
        email: 'john@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toContain('already exists');
  });

  it('should login with valid credentials', async () => {
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('should reject invalid password', async () => {
    await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
  });

  it('should get current user with valid token', async () => {
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });

    const token = signUser(user);

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('john@example.com');
  });

  it('should reject request without token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });
});
```

---

## Debugging

### Check Token in Browser Console
```javascript
// Get token
console.log(localStorage.getItem('token'));

// Decode token (install jwt-decode)
import jwtDecode from 'jwt-decode';
const decoded = jwtDecode(localStorage.getItem('token'));
console.log(decoded);

// Check expiry
const exp = decoded.exp * 1000;
console.log(new Date(exp));
```

### Check Backend Logs
```javascript
// Add logging to auth middleware
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.slice(7);
  console.log('Token:', token?.slice(0, 20) + '...');
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Payload:', payload);
    // ...
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Test OAuth Locally
```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev

# Visit http://localhost:5173/login
# Click "Sign in with Google"
# Check browser console for redirects
# Check backend logs for OAuth flow
```

---

## Security Checklist

- [ ] JWT_SECRET is strong (32+ chars, random)
- [ ] Passwords hashed with bcryptjs (10 rounds)
- [ ] HTTPS enforced in production
- [ ] CORS configured for frontend domain only
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all endpoints
- [ ] Sensitive fields excluded from responses
- [ ] Token expiry set (7 days)
- [ ] Refresh token strategy implemented (optional)
- [ ] OAuth credentials stored in .env
- [ ] No credentials in version control
- [ ] Error messages don't leak user info
