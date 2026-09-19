const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

async function upsertUser({ provider, profile }) {
  const providerId = provider === 'google' ? { googleId: profile.id } : { githubId: profile.id };
  const email = profile.emails?.[0]?.value;
  const name = profile.displayName || profile.username || email || 'RepoMarket user';
  const avatar = profile.photos?.[0]?.value;
  const user = await User.findOneAndUpdate(
    providerId,
    { $set: { ...providerId, email, name, avatar } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return user;
}

function configurePassport() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    }, async (_accessToken, _refreshToken, profile, done) => {
      try { return done(null, await upsertUser({ provider: 'google', profile })); } catch (error) { return done(error); }
    }));
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback'
    }, async (_accessToken, _refreshToken, profile, done) => {
      try { return done(null, await upsertUser({ provider: 'github', profile })); } catch (error) { return done(error); }
    }));
  }
}

module.exports = { configurePassport };
