import { NextResponse } from 'next/server';
import { warmPublicData } from '@/server/warm';

export const dynamic = 'force-dynamic';

// Keep-alive for shared hosting. cPanel → Cron Jobs, every 5 minutes:
//   curl -fsS -m 30 https://<your-domain>/api/health > /dev/null 2>&1
// Passenger stops an app that gets no requests for a few minutes, and the next visitor then waits for a cold start
// (Node.js + Next.js + a new MongoDB connection). Regular calls keep it running and its page data fresh.
export async function GET() {
  const { ms, ok } = await warmPublicData();
  return NextResponse.json(
    { ok: true, database: ok ? 'ok' : 'unreachable', uptime: Math.round(process.uptime()), ms },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
