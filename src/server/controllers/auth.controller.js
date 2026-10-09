import { HttpError, created, ok, readJson } from '@/server/http';
import * as users from '@/server/services/user.service';
import { createSessionToken, clearSessionCookie, setSessionCookie } from '@/lib/session';
import { homeForRole } from '@/lib/auth-guard';
import { getClientIp } from '@/lib/visitor';
import { isRateLimited } from '@/lib/rate-limit';
import { NextResponse, after } from 'next/server';
import * as mail from '@/server/services/mail.service';
import { str } from '@/server/validate';
import { recordActivity, recordLogin } from '@/server/services/audit.service';

// Who can sign up on /register, and what each must tell us. Every new account starts 'pending' and
// can't sign in until an admin approves it. Students become members (and get a login) through /join.
const SIGNUP_TYPES = {
  alumni: { role: 'alumni', required: [['studentId', 'Student ID'], ['batch', 'Batch']], fields: ['studentId', 'batch', 'department'] },
  faculty: { role: 'admin', required: [['designation', 'Designation'], ['department', 'Department']], fields: ['designation', 'department'] },
};

function sessionResponse(user, status = 200, message) {
  const body = { success: true, ...(message && { message }), data: { user: users.toPublicUser(user), redirectTo: homeForRole(user.role) } };
  const response = NextResponse.json(body, { status });
  setSessionCookie(response, createSessionToken(user));
  return response;
}

export async function signIn({ req }) {
  if (!process.env.JWT_SECRET) throw new HttpError(500, 'Server misconfiguration: JWT_SECRET missing.');
  const { email, password } = await readJson(req);
  if (isRateLimited(`login:${getClientIp(req)}`)) {
    await recordLogin(req, { email, success: false, reason: 'Too many attempts (rate limited)' });
    throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
  }
  if (!email || !password) throw new HttpError(400, 'Email and password are required.');
  let user;
  try {
    user = await users.authenticate(email, password);
  } catch (error) {
    const reason = error.status !== 403 ? 'Wrong email or password' : /not approved yet/.test(error.message) ? 'Waiting for approval' : 'Account suspended';
    await recordLogin(req, { email, success: false, reason });
    throw error;
  }
  await recordLogin(req, { email, success: true, user });
  return sessionResponse(user);
}

export async function register({ req }) {
  if (process.env.ALLOW_REGISTRATION === 'false') throw new HttpError(403, 'Registration is closed.');
  if (isRateLimited(`register:${getClientIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 })) {
    throw new HttpError(429, 'Too many sign-ups from this network. Try again later.');
  }
  const body = await readJson(req);
  const type = SIGNUP_TYPES[str(body.type)];
  if (!type) throw new HttpError(400, 'Choose Alumni or Faculty. Current students join through the Join Us form.');
  const input = body.profile || {};
  const profile = Object.fromEntries(type.fields.map((key) => [key, str(input[key], 120)]));
  const missing = type.required.filter(([key]) => !profile[key]).map(([, label]) => label);
  if (missing.length) throw new HttpError(400, `Please fill in: ${missing.join(', ')}.`);
  // The role comes from the chosen type only — never from the request body
  const user = await users.createUser(
    { name: body.name, email: body.email, phone: body.phone, password: body.password, role: type.role, status: 'pending' },
    { profile }
  ).catch((error) => {
    if (error?.code === 11000) throw new HttpError(409, 'An account with this email already exists.');
    throw error;
  });
  await recordActivity(req, { user, action: 'register', entity: 'Account', entityId: user._id, summary: `Signed up (${str(body.type)}) — waiting for approval` });
  after(() => Promise.all([mail.sendAccountReceived(user), mail.sendAccountAdminNotice(user, profile)]));
  return created(
    { pending: true, email: user.email },
    'Thanks! Your account is waiting for approval. We have emailed you and will email again as soon as you can sign in.'
  );
}

// Who is signed in, for the public Navbar avatar. Visitors get `data: null` (not a 401) so pages stay quiet.
export async function currentSession({ session }) {
  if (!session) return ok(null);
  const user = await users.getUserById(session._id).catch(() => null);
  if (!user || user.status !== 'active') return ok(null);
  const profile = await users.getProfile(user).catch(() => null);
  const { _id, name, email, role } = users.toPublicUser(user);
  return ok({ _id, name, email, role, photo: profile?.photo || '', home: homeForRole(role) });
}

export async function me({ session }) {
  const user = await users.getUserById(session._id).catch(() => null);
  if (!user || user.status !== 'active') {
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
