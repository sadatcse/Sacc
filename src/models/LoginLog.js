import mongoose from 'mongoose';

// One sign-in attempt (successful or not). Shown in Dashboard → Login History.
// Kept for 180 days (TTL index on createdAt).
const LoginLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // set when the email belongs to an account
  email: { type: String, trim: true, lowercase: true, default: '' },
  name: { type: String, trim: true, default: '' },
  role: { type: String, default: '' },
  success: { type: Boolean, default: false, index: true },
  reason: { type: String, default: '' }, // why it failed
  ip: { type: String, default: '' },
  country: { type: String, default: '' },
  city: { type: String, default: '' },
  browser: { type: String, default: '' },
  os: { type: String, default: '' },
  device: { type: String, default: '' }, // Desktop | Mobile | Tablet
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 180 },
});

export default mongoose.models.LoginLog || mongoose.model('LoginLog', LoginLogSchema);
