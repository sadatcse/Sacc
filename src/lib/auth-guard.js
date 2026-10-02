import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from './session';

// Returns the session payload ({ _id, email, name, role }) or null when not signed in.
export function requireAdmin(req) {
  const token = req.cookies?.get?.(SESSION_COOKIE)?.value;
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
}
