import { NextResponse } from 'next/server';
import { HttpError, created, ok, readJson } from '@/server/http';
import * as membership from '@/server/services/membership.service';
import { getClientIp } from '@/lib/visitor';
import { isRateLimited } from '@/lib/rate-limit';

// Public: multipart form from /join (fields + `photo` file). Saved as a draft.
export async function submit({ req }) {
  const ip = getClientIp(req);
  // Generous limit: many students share one campus IP
  if (isRateLimited(`membership:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 })) {
    throw new HttpError(429, 'Too many applications from this network. Please try again later.');
  }
  let form;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, 'Send the application as multipart form data.');
  }
  const result = await membership.submitApplication(form, { ip });
  return created(result, 'Application received! We will review it and contact you soon.');
}

export async function list({ query }) {
  return ok(await membership.listApplications({ status: query.get('status'), search: query.get('search') }));
}

export async function review({ req, params, session }) {
  return ok(await membership.reviewApplication(params.id, await readJson(req), { userId: session._id }), 'Application updated.');
}

export async function remove({ params }) {
  await membership.deleteApplication(params.id);
  return ok(undefined, 'Application deleted.');
}

// Admin-only photo (not public — applicants' photos are personal data)
export async function photo({ params }) {
  const { data, contentType } = await membership.getPhoto(params.id);
  return new NextResponse(data, {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' },
  });
}
