import { after } from 'next/server';
import { HttpError, created, ok, readJson } from '@/server/http';
import * as requests from '@/server/services/alumni-request.service';
import * as users from '@/server/services/user.service';
import * as mail from '@/server/services/mail.service';

// Student: ask to become alumni
export async function submit({ req, session }) {
  const user = await users.getUserById(session._id).catch(() => null);
  if (!user) throw new HttpError(401, 'Session expired.');
  const request = await requests.submitRequest(user, await readJson(req));
  after(() => mail.sendAlumniRequestAdminNotice(request));
  return created(request, 'Request sent! An admin will review it and email you.');
}

// Student: my latest request (or null)
export async function mine({ session }) {
  return ok(await requests.getMyRequest(session._id));
}

// Admin
export async function list({ query }) {
  return ok(await requests.listRequests({ status: query.get('status') }));
}

export async function review({ req, params, session }) {
  const { request, slug } = await requests.reviewRequest(params.id, await readJson(req), { userId: session._id });
  after(() => mail.sendAlumniRequestDecision(request, slug));
  return ok(request, request.status === 'approved' ? 'Approved — the account is now an alumni account.' : 'Request rejected.');
}

// Admin: Dashboard → Executives → Convert to Alumni
export async function convertExecutive({ req, params }) {
  const result = await requests.convertExecutive(params.id, await readJson(req));
  return ok(result, result.linkedAccount ? 'Converted — their login is now an alumni account too.' : 'Alumni entry created.');
}
