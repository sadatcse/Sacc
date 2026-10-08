import { HttpError, ok, readJson } from '@/server/http';
import * as users from '@/server/services/user.service';
import { createSessionToken, clearSessionCookie, setSessionCookie } from '@/lib/session';
import { homeForRole } from '@/lib/auth-guard';
import { getClientIp } from '@/lib/visitor';
import { isRateLimited } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { str } from '@/server/validate';

// Roles anyone may sign up as. Admin (faculty) accounts are created by an existing admin.
const SELF_SIGNUP_ROLES = ['student', 'alumni'];

function sessionResponse(user, status = 200, message) {
  const body = { success: true, ...(message && { message }), data: { user: users.toPublicUser(user), redirectTo: homeForRole(user.role) } };
  const response = NextResponse.json(body, { status });
  setSessionCookie(response, createSessionToken(user));
  return response;
}

export async function signIn({ req }) {
  if (!process.env.JWT_SECRET) throw new HttpError(500, 'Server misconfiguration: JWT_SECRET missing.');
  if (isRateLimited(`login:${getClientIp(req)}`)) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
  const { email, password } = await readJson(req);
  if (!email || !password) throw new HttpError(400, 'Email and password are required.');
  const user = await users.authenticate(email, password);
  return sessionResponse(user);
}

export async function register({ req }) {
  if (process.env.ALLOW_REGISTRATION === 'false') throw new HttpError(403, 'Registration is closed.');
  if (isRateLimited(`register:${getClientIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 })) {
    throw new HttpError(429, 'Too many sign-ups from this network. Try again later.');
  }
  const body = await readJson(req);
  const role = str(body.role);
  if (!SELF_SIGNUP_ROLES.includes(role)) throw new HttpError(400, 'You can register as a student or an alumnus.');
  const user = await users.createUser(
    { name: body.name, email: body.email, phone: body.phone, password: body.password, role, status: 'active' },
    { profile: body.profile || {} }
  ).catch((error) => {
    if (error?.code === 11000) throw new HttpError(409, 'An account with this email already exists.');
    throw error;
  });
  return sessionResponse(user, 201, role === 'alumni' ? 'Welcome! Your alumni profile will appear in the directory once an admin approves it.' : 'Welcome!');
}

export async function me({ session }) {
  const user = await users.getUserById(session._id).catch(() => null);
  if (!user || user.status === 'suspended') {
    const response = NextResponse.json({ success: false, message: 'Session expired.' }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }
  const profile = await users.getProfile(user);
  return ok({ user: users.toPublicUser(user), profile });
}

export async function logout() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  clearSessionCookie(response);
  return response;
}

export async function changePassword({ req, session }) {
  const { currentPassword, newPassword } = await readJson(req);
  await users.changePassword(session._id, currentPassword, newPassword);
  return ok(undefined, 'Password updated.');
}
