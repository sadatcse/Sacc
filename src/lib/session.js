import jwt from 'jsonwebtoken';

export const SESSION_COOKIE = 'token';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export function createSessionToken(user) {
  return jwt.sign(
    { _id: String(user._id), email: user.email, name: user.name || '', role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function setSessionCookie(response, token) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, expires: new Date(0), path: '/' });
}
