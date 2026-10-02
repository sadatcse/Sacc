import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { createSessionToken, setSessionCookie } from '@/lib/session';
import { getClientIp } from '@/lib/visitor';
import { isRateLimited } from '@/lib/rate-limit';

export async function POST(req) {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ message: 'Server misconfiguration: JWT_SECRET missing' }, { status: 500 });
    }
    if (isRateLimited(`login:${getClientIp(req)}`)) {
      return NextResponse.json({ message: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    const valid = user && (await bcrypt.compare(String(password), user.password));
    if (!valid) {
      return NextResponse.json({ message: 'Incorrect email or password.' }, { status: 401 });
    }

    const session = { _id: String(user._id), email: user.email, name: user.name || '', role: user.role };
    const response = NextResponse.json({ user: session });
    setSessionCookie(response, createSessionToken(user));
    return response;
  } catch (error) {
    console.error('Sign-in error:', error);
    return NextResponse.json({ message: 'Sign-in failed.' }, { status: 500 });
  }
}
