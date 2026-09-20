const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true, trim: true },
    githubId: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, trim: true, lowercase: true, sparse: true },
    password: { type: String, select: false },
    emailOtp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    isEmailVerified: { type: Boolean, default: false },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, trim: true },
    role: { type: String, enum: ['SELLER', 'BUYER'], default: 'BUYER' },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
