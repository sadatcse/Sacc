// Helpers shared by every API route / controller.
//   export const GET = route(controller.list);                       // public
//   export const POST = route(controller.create, { roles: ['admin'] }); // signed-in admins only
//   export const PUT = route(controller.update, { auth: true });       // any signed-in user
// The handler receives { req, params, query, session } and returns a NextResponse.
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getSession } from '@/lib/auth-guard';

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
      const session = getSession(req);
      if (auth && !session) return fail('Please sign in.', 401);
      if (roles && !roles.includes(session.role)) return fail('You do not have permission to do that.', 403);
      await connectDB();
      const params = ctx?.params ? await ctx.params : {};
      const query = new URL(req.url).searchParams;
      return await handler({ req, params, query, session });
    } catch (error) {
      return toResponse(error);
    }
  };
}
