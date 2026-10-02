import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import VisitorLog from '@/models/VisitorLog';

export const dynamic = 'force-dynamic';

// Public: counts only (shown in the footer). No IPs or visitor details.
export async function GET() {
  try {
    await connectDB();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [today, total, online] = await Promise.all([
      VisitorLog.countDocuments({ createdAt: { $gte: startOfToday } }),
      VisitorLog.estimatedDocumentCount(),
      VisitorLog.countDocuments({ createdAt: { $gte: fiveMinutesAgo } }),
    ]);
    return NextResponse.json({ success: true, stats: { today, total, online: Math.max(1, online) } });
  } catch (error) {
    console.error('Visitor summary error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
