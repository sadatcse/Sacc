import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const ALLOWED_ORIGINS = [SITE_URL, 'http://localhost:3000', 'http://localhost:3001'];

// Session payload ({ _id, email, name, role }) or null
function readSession(token) {
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

const homeForRole = (role) => (role === 'admin' ? '/dashboard' : '/account');

function redirectToLogin(request, pathname, hadToken) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  const response = NextResponse.redirect(loginUrl);
  if (hadToken) response.cookies.delete('token');
  return response;
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // 1. CORS for /api routes (role checks happen inside each route)
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
  const session = readSession(token);

  // 2. /dashboard → admins (faculty) only; students & alumni go to their account page
  if (pathname.startsWith('/dashboard')) {
    if (!session) return redirectToLogin(request, pathname, Boolean(token));
    if (session.role !== 'admin') return NextResponse.redirect(new URL('/account', request.url));
  }

  // 3. /account → any signed-in user
  if (pathname.startsWith('/account') && !session) return redirectToLogin(request, pathname, Boolean(token));

  // 4. Signed-in users skip the login / register pages
  if ((pathname === '/login' || pathname === '/register') && session) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/account/:path*', '/login', '/register'],
};
