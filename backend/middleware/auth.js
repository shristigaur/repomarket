const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signUser(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function requireAuth(req, res, next) {
  // The browser never receives this JWT; it only sends the httpOnly cookie.
  const token = req.cookies?.token;

  if (!token) return res.status(401).json({ error: 'Authentication is required.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const decodedUser = await User.findById(payload.sub);
    if (!decodedUser) return res.status(401).json({ error: 'Authentication is required.' });
    req.user = decodedUser;
    return next();
  } catch {
    return res.status(401).json({ error: 'Authentication is required.' });
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
