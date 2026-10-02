import { NextResponse } from 'next/server';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

// Returns the signed-in admin (used by AuthProvider on page load).
export async function GET(req) {
  const session = requireAdmin(req);
  if (!session) return unauthorizedResponse();
  const { _id, email, name, role } = session;
  return NextResponse.json({ user: { _id, email, name, role } });
}
