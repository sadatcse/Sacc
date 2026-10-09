import mongoose from 'mongoose';

export const ACTIVITY_ACTIONS = ['create', 'update', 'delete', 'register', 'logout', 'password_change'];

// Something a signed-in user did (created a post, approved an application, updated a profile…).
// Written automatically for every successful change made through the API (src/server/http.js).
// Shown in Dashboard → User Activity. Kept for 180 days (TTL index on createdAt).
const ActivityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  role: { type: String, default: '' },
  action: { type: String, default: '' },
  entity: { type: String, default: '' }, // e.g. 'News post', 'User', 'Membership application'
  entityId: { type: String, default: '' },
  summary: { type: String, default: '' }, // human-readable sentence
  method: { type: String, default: '' },
  path: { type: String, default: '' },
  ip: { type: String, default: '' },
  country: { type: String, default: '' },
  browser: { type: String, default: '' },
  os: { type: String, default: '' },
  device: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 180 },
});

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
