import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const ALLOWED_ORIGINS = [SITE_URL, 'http://localhost:3000', 'http://localhost:3001'];

function isValidToken(token) {
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // 1. CORS for /api routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const corsOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : SITE_URL;

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', corsOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
  }

  const token = request.cookies.get('token')?.value;
  const valid = isValidToken(token);

  // 2. Protect /dashboard
  if (pathname.startsWith('/dashboard') && !valid) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete('token');
    return response;
  }

  // 3. Logged-in users skip the login page
  if (pathname === '/login' && valid) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/login'],
};
