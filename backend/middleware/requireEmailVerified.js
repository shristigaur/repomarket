function requireEmailVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication is required.' });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({ error: 'Verify your email before continuing.' });
  }

  return next();
}

module.exports = { requireEmailVerified };
