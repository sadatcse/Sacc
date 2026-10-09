import { after } from 'next/server';
import { ok, readJson } from '@/server/http';
import * as requests from '@/server/services/alumni-request.service';
import * as mail from '@/server/services/mail.service';

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
