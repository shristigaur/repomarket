const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signUser(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function requireAuth(req, res, next) {
  // Support both cookies and Authorization header
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Support fallback query param as requested
  if (!token && req.query.userId) {
    try {
      const decodedUser = await User.findById(req.query.userId);
      if (decodedUser) {
        req.user = decodedUser;
        return next();
      }
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
  }

  if (!token) {
    return res.status(400).json({ success: false, message: 'Missing authorization token or user ID' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const decodedUser = await User.findById(payload.sub);
    if (!decodedUser) {
      return res.status(400).json({ success: false, message: 'Invalid authorization token or user ID' });
    }
    req.user = decodedUser;
    return next();
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
}

async function optionalAuth(req, _res, next) {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.sub);
  } catch {
    // Anonymous listing creation remains supported; invalid optional tokens are ignored.
  }
  return next();
}

module.exports = { requireAuth, optionalAuth, signUser };
