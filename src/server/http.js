// Helpers shared by every API route / controller.
//   export const GET = route(controller.list);                       // public
//   export const POST = route(controller.create, { roles: ['admin'] }); // signed-in admins only
//   export const PUT = route(controller.update, { auth: true });       // any signed-in user
// The handler receives { req, params, query, session } and returns a NextResponse.
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth-guard';
import User from '@/models/User';
import { describeChange, recordActivity } from '@/server/services/audit.service';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
// Logged elsewhere (sign-in / register in auth.controller) or not user actions
const NOT_TRACKED = /^\/api\/(auth\/sign-in|auth\/register|visitor\/|settings\/email\/test)/;

// Every successful change by a signed-in user is written to the activity log (Dashboard → User Activity)
async function trackChange(req, session, response) {
  const path = new URL(req.url).pathname;
  if (!session || !MUTATING.has(req.method) || response.status >= 400 || NOT_TRACKED.test(path)) return;
  let data;
  try {
    data = (await response.clone().json())?.data;
  } catch {
    /* non-JSON response */
  }
  const change = describeChange(req.method, path, data);
  if (change) await recordActivity(req, { session, ...change });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const ok = (data, message) => NextResponse.json({ success: true, ...(message && { message }), ...(data !== undefined && { data }) });
export const created = (data, message) => NextResponse.json({ success: true, ...(message && { message }), data }, { status: 201 });
export const fail = (message, status = 400) => NextResponse.json({ success: false, message }, { status });

export async function readJson(req) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new HttpError(400, 'Request body must be a JSON object.');
  }
}

function toResponse(error) {
  if (error instanceof HttpError) return fail(error.message, error.status);
  if (error?.name === 'ValidationError') return fail(Object.values(error.errors)[0]?.message || 'Invalid data.', 400);
  if (error?.name === 'CastError') return fail('Invalid id.', 400);
  if (error?.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    return fail(`That ${field} is already in use.`, 409);
  }
  console.error('API error:', error);
  return fail('Server error.', 500);
}

export function route(handler, { roles, auth = Boolean(roles) } = {}) {
  return async function routeHandler(req, ctx) {
    try {
      let session = getSession(req);
      await connectDB();
      // The cookie only proves who signed in. Status and role are read fresh, so an account that is
      // pending again (membership moved back to draft), suspended or demoted loses access right away.
      if (session) {
        const user = await User.findById(session._id).select('status role').lean().catch(() => null);
        session = user?.status === 'active' ? { ...session, role: user.role } : null;
      }
      if (auth && !session) return fail('Please sign in.', 401);
      if (roles && !roles.includes(session.role)) return fail('You do not have permission to do that.', 403);
      const params = ctx?.params ? await ctx.params : {};
      const query = new URL(req.url).searchParams;
      const response = await handler({ req, params, query, session });
      await trackChange(req, session, response);
      return response;
    } catch (error) {
      return toResponse(error);
    }
  };
}
