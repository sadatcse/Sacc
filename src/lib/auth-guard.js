import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from './session';

// Verifies a session token → { _id, email, name, role } or null
export function verifySessionToken(token) {
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Session from an API request, any role
export function getSession(req) {
  return verifySessionToken(req.cookies?.get?.(SESSION_COOKIE)?.value);
}

// Session only when the user has one of `roles`
export function requireRole(req, roles) {
  const session = getSession(req);
  return session && roles.includes(session.role) ? session : null;
}

// Admins (teachers / faculty) only
export function requireAdmin(req) {
  return requireRole(req, ['admin']);
}

// Session in a server component / layout
export async function getServerSession() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

// Where each role lands after signing in
export function homeForRole(role) {
  return role === 'admin' ? '/dashboard' : '/account';
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
}
