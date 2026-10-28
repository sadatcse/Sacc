// Server-side cache for data every visitor sees (home feed, committee, gallery, contacts). Visitors never wait for
// MongoDB once a value is cached: after PUBLIC_CACHE_MS the old value is still served at once while a fresh copy is
// loaded in the background (stale-while-revalidate). Visitors arriving together share one query.
// An admin's change through the API (route() in src/server/http.js) clears it, so edits show up at once on this
// server process; other processes (Passenger may run several) refresh within PUBLIC_CACHE_MS.
// Kept on globalThis: Next.js bundles pages and API routes separately, and both must see the same cache.
// Cached values are shared between requests — callers must not mutate them.
const store = (globalThis.__usaccPublicCache ??= new Map());
export const PUBLIC_CACHE_MS = 60 * 1000;

export function cachedPublic(key, load, ttl = PUBLIC_CACHE_MS) {
  const hit = store.get(key);
  if (hit) {
    if (hit.expires <= Date.now() && !hit.refreshing) {
      hit.refreshing = true;
      load().then(
        (value) => store.set(key, { promise: Promise.resolve(value), expires: Date.now() + ttl }),
        () => {
          hit.refreshing = false; // database unreachable — keep serving the last value, retry on a later visit
        }
      );
    }
    return hit.promise;
  }
  const entry = { promise: load(), expires: Date.now() + ttl };
  store.set(key, entry);
  entry.promise.catch(() => {
    if (store.get(key) === entry) store.delete(key); // don't keep a failed first load
  });
  return entry.promise;
}

export function clearPublicCache() {
  store.clear();
}
