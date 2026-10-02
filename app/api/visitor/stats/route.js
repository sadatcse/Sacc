import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import VisitorLog from '@/models/VisitorLog';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// Admin: full analytics for Dashboard › Traffic Analytics
export async function GET(req) {
  if (!requireAdmin(req)) return unauthorizedResponse();
  try {
    await connectDB();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [today, total, online, yesterday, month, year, sourceBreakdown, recent, countries] = await Promise.all([
      VisitorLog.countDocuments({ createdAt: { $gte: startOfToday } }),
      VisitorLog.estimatedDocumentCount(),
      VisitorLog.countDocuments({ createdAt: { $gte: fiveMinutesAgo } }),
      VisitorLog.countDocuments({ createdAt: { $gte: startOfYesterday, $lt: startOfToday } }),
      VisitorLog.countDocuments({ createdAt: { $gte: startOfMonth } }),
      VisitorLog.countDocuments({ createdAt: { $gte: startOfYear } }),
      VisitorLog.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
      VisitorLog.find().sort({ createdAt: -1 }).limit(300).lean(),
      VisitorLog.aggregate([
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const countFor = (name) => sourceBreakdown.find((s) => s._id === name)?.count || 0;

    return NextResponse.json({
      success: true,
      stats: {
        today,
        total,
        online: Math.max(1, online),
        yesterday,
        month,
        year,
        sources: { direct: countFor('Direct'), searchEngine: countFor('Search Engine'), referral: countFor('Referral') },
        recent,
        countries: countries.map((c) => ({ name: c._id, count: c.count })),
      },
    });
  } catch (error) {
    console.error('Visitor stats error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
