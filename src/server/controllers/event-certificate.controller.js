import { NextResponse } from 'next/server';
import { HttpError, created, ok, readJson } from '@/server/http';
import { isRateLimited } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/visitor';
import * as events from '@/server/services/event-certificate.service';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const pdfResponse = ({ bytes, fileName }, download) =>
  new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${fileName}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

// ---- events (admin) ----

export async function list() {
  return ok(await events.listEvents());
}

export async function create({ req, session }) {
  return created(await events.createEvent(await readJson(req), { userId: session._id }), 'Event created.');
}

export async function show({ params }) {
  return ok(await events.getEventBoard(params.id));
}

export async function update({ req, params }) {
  return ok(await events.updateEvent(params.id, await readJson(req)), 'Event saved.');
}

export async function remove({ params }) {
  const event = await events.deleteEvent(params.id);
  return ok(event, `Event deleted with ${plural(event.deletedCertificates, 'certificate')}.`);
}

// { type, recipients: [{ name, institution?, email?, detail? }] }
export async function addRecipients({ req, params, session }) {
  const result = await events.addRecipients(params.id, await readJson(req), { userId: session._id });
  const parts = [`${plural(result.added, 'certificate')} issued`, result.skipped.length && `${result.skipped.length} already had one (skipped: ${result.skipped.slice(0, 5).join(', ')}${result.skipped.length > 5 ? '…' : ''})`];
  return created({ ...result, title: plural(result.added, 'certificate') }, `${parts.filter(Boolean).join(', ')}.`);
}

// Every certificate of the event in one PDF (?type=speaker for one type)
export async function bundle({ params, query }) {
  return pdfResponse(await events.renderEventBundle(params.id, { type: query.get('type') }), query.get('download'));
}

// ---- one certificate ----

export async function updateCertificate({ req, params }) {
  const cert = await events.updateEventCertificate(params.id, await readJson(req));
  return ok(cert, cert.revoked ? 'Certificate revoked.' : 'Certificate saved.');
}

export async function removeCertificate({ params }) {
  return ok(await events.deleteEventCertificate(params.id), 'Certificate deleted.');
}

// Admins, or anyone with the code when the event allows downloads (checked in the service)
export async function pdf({ req, params, query, session }) {
  if (session?.role !== 'admin' && isRateLimited(`event-pdf:${getClientIp(req)}`, { limit: 30, windowMs: 10 * 60 * 1000 })) {
    throw new HttpError(429, 'Too many downloads — please try again in a few minutes.');
  }
  return pdfResponse(await events.renderEventPdf(params.code, session), query.get('download'));
}
