// Tiny in-memory limiter (per server instance) — slows down password guessing, form spam and request floods.
const hits = new Map();
let nextSweep = 0;

export function isRateLimited(key, { limit = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const now = Date.now();
  // Forget expired entries now and then, so a flood of different IPs can't grow the map forever
  if (now > nextSweep) {
    for (const [k, entry] of hits) if (now > entry.reset) hits.delete(k);
    nextSweep = now + 60 * 1000;
  }
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
