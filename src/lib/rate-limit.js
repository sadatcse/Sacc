// Tiny in-memory limiter (per server instance) — slows down password guessing on /api/auth/sign-in.
const hits = new Map();

export function isRateLimited(key, { limit = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
