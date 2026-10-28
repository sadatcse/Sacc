import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import VisitorLog from '@/models/VisitorLog';
import { detectSource, getClientIp, resolveCountry } from '@/lib/visitor';
import { isRateLimited } from '@/lib/rate-limit';

// Public: records one visit per browser session (called from AppShell)
export async function POST(req) {
  try {
    const { referrer = '', path = '/', userAgent = 'Unknown' } = await req.json();
    const ip = getClientIp(req);
    // One visit per browser session is normal; anything far beyond that is a script filling the database
    if (isRateLimited(`visit:${ip}`, { limit: 30, windowMs: 60 * 60 * 1000 })) return NextResponse.json({ success: true });
    const country = await resolveCountry(req, ip);
    const { source, sourceName } = detectSource(referrer);

    await connectDB();
    await VisitorLog.create({
      ip,
      country,
      referrer: String(referrer).slice(0, 500),
      source,
      sourceName,
      path: String(path).slice(0, 300),
      userAgent: String(userAgent).slice(0, 500),
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Visitor log error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
