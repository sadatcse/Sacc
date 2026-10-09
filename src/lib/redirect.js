// Where to send someone after they sign in / sign up.
// `from` must be a path on this site (never another domain), and only admins may return to /dashboard.
export function safeRedirect(from, role, fallback) {
  if (!from || typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || from.startsWith('/\\')) return fallback;
  if (from.startsWith('/dashboard') && role !== 'admin') return fallback;
  if (from.startsWith('/login') || from.startsWith('/register')) return fallback;
  return from;
}

// Pages that need a signed-in user (any role). Checked by proxy.js and by the pages themselves.
export const isMembersOnlyPath = (pathname) => /^\/alumni\/[^/]+\/?$/.test(pathname);
