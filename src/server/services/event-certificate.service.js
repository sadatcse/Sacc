// Event certificates (Dashboard → Event Certificates): an event (CertificateEvent) — programming contest, seminar,
// workshop… — and one certificate per person (EventCertificate): participant, winner, speaker, guest, judge,
// volunteer or organizer. Codes look like SACC-E26-7KQ4MZ and verify on the same page as executive
// certificates (/certificates/<code>). Also: verifyCertificate(code) — the universal lookup for that page.
import crypto from 'node:crypto';
import connectDB from '@/lib/db';
import CertificateEvent from '@/models/CertificateEvent';
import EventCertificate from '@/models/EventCertificate';
import Executive from '@/models/Executive';
import CommitteePosition from '@/models/CommitteePosition';
import { siteConfig } from '@/config/site';
import {
  EVENT_CERT_TYPE, EVENT_CERT_TYPE_VALUES, EVENT_CERT_TYPES, EVENT_INTRO, MAX_EVENT_SIGNERS, MAX_RECIPIENTS_PER_ADD,
} from '@/config/event-certificates';
import { certificatePdf, certificatesPdf, fillTemplate, pdfSafe } from '@/lib/certificate-pdf';
import { formatCalendarDate } from '@/lib/utils';
import { todayInTimeZone } from '@/lib/timezone';
import { getSetting } from '@/server/services/settings.service';
import { getCertificateByCode } from '@/server/services/certificate.service';
import { HttpError } from '@/server/http';
import { assertId, notFound, str, toPlain } from '@/server/validate';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const randomCode = (date) =>
  `${siteConfig.shortName}-E${String(date).slice(2, 4)}-${Array.from({ length: 6 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('')}`;
export const eventPdfPath = (code) => `/api/event-certificates/pdf/${code}`;
const verifyPath = (code) => `/certificates/${code}`;

const validDate = (value, label, { required = false } = {}) => {
  const v = str(value, 10);
  if (!v) {
    if (required) throw new HttpError(400, `${label} is required.`);
    return '';
  }
  if (!DATE_RE.test(v) || Number.isNaN(Date.parse(v))) throw new HttpError(400, `Enter a valid ${label.toLowerCase()}.`);
  return v;
};

// "15 October 2026" or "15 October 2026 - 16 October 2026"
export function eventDateText(event) {
  if (!event?.date) return '';
  const start = formatCalendarDate(event.date);
  return event.endDate && event.endDate !== event.date ? `${start} – ${formatCalendarDate(event.endDate)}` : start;
}

// Title + text for one certificate type at an event (the event's own wording, else the default)
export function wordingFor(event, type) {
  const base = EVENT_CERT_TYPE[type] || EVENT_CERT_TYPE.participant;
  const own = event?.wording?.[type] || {};
  return { title: own.title || base.title, body: own.body || base.body };
}

const certToClient = (c) => toPlain({ ...c, name: c.recipient?.name || '', verifyUrl: verifyPath(c.code), pdfUrl: eventPdfPath(c.code) });

// ---------- signers ----------

// People who can sign: faculty in Executives (with their signature image, if uploaded) — newest advisor role first
async function signerOptions() {
  const people = await Executive.find({ kind: 'faculty' }).select('name designation department signature.contentType').sort({ name: 1 }).lean();
  const roles = await CommitteePosition.find({ executive: { $in: people.map((p) => p._id) }, type: 'advisor' }).sort({ year: -1, order: 1 }).select('executive role').lean();
  const roleOf = new Map();
  for (const r of roles) if (!roleOf.has(String(r.executive))) roleOf.set(String(r.executive), r.role);
  return toPlain(
    people.map((p) => ({ _id: p._id, name: p.name, designation: p.designation || '', department: p.department || '', role: roleOf.get(String(p._id)) || '', hasSignature: Boolean(p.signature?.contentType) }))
  );
}

// Signers for a new event: the newest committee's top advisors
async function defaultSigners() {
  const latest = await CommitteePosition.findOne({ type: 'advisor' }).sort({ year: -1 }).select('year').lean();
  if (!latest) return [];
  const rows = await CommitteePosition.find({ year: latest.year, type: 'advisor' }).sort({ order: 1 }).populate('executive', 'name designation department').lean();
  const seen = new Set();
  return rows
    .filter((p) => p.executive && !seen.has(String(p.executive._id)) && seen.add(String(p.executive._id)))
    .slice(0, MAX_EVENT_SIGNERS)
    .map(({ role, executive: e }) => ({ executive: e._id, name: e.name, role, designation: e.designation || '', department: e.department || '' }));
}

// [{ executive?, name?, role?, designation?, department? }] → snapshots (a picked person's details come from Executives)
async function cleanSigners(input) {
  const rows = (Array.isArray(input) ? input : []).slice(0, MAX_EVENT_SIGNERS);
  const ids = rows.map((r) => r?.executive).filter(Boolean);
  ids.forEach((id) => assertId(id, 'signer'));
  const people = new Map((await Executive.find({ _id: { $in: ids } }).select('name designation department').lean()).map((p) => [String(p._id), p]));
  return rows
    .map((r) => {
      const person = r.executive && people.get(String(r.executive));
      return {
        ...(person && { executive: person._id }),
        name: str(r.name, 120) || person?.name || '',
        role: str(r.role, 80),
        designation: str(r.designation, 120) || person?.designation || '',
        department: str(r.department, 120) || person?.department || '',
      };
    })
    .filter((s) => s.name);
}

// ---------- events ----------

async function cleanEvent(input, current = {}) {
  const data = {
    title: str(input.title, 160),
    date: validDate(input.date, 'Event date', { required: true }),
    endDate: validDate(input.endDate, 'End date'),
    venue: str(input.venue, 200),
    organizer: str(input.organizer, 200),
    issuedOn: validDate(input.issuedOn, 'Issue date'),
    publicPdf: input.publicPdf === undefined ? current.publicPdf ?? true : input.publicPdf === true || input.publicPdf === 'true',
  };
  if (!data.title) throw new HttpError(400, 'Enter the event name.');
  if (data.endDate && data.endDate < data.date) throw new HttpError(400, 'The end date is before the start date.');
  if (data.endDate === data.date) data.endDate = '';
  if ('signers' in input) data.signers = await cleanSigners(input.signers);
  if ('wording' in input) {
    data.wording = Object.fromEntries(
      EVENT_CERT_TYPE_VALUES.map((t) => [t, { title: str(input.wording?.[t]?.title, 80), body: str(input.wording?.[t]?.body, 600) }]).filter(([, w]) => w.title || w.body)
    );
  }
  return data;
}

export async function listEvents() {
  await connectDB();
  const [events, counts] = await Promise.all([
    CertificateEvent.find().sort({ date: -1, createdAt: -1 }).lean(),
    EventCertificate.aggregate([{ $group: { _id: { event: '$event', type: '$type' }, count: { $sum: 1 } } }]),
  ]);
  const byEvent = new Map();
  for (const { _id, count } of counts) {
    const key = String(_id.event);
    byEvent.set(key, { ...(byEvent.get(key) || {}), [_id.type]: count });
  }
  return {
    events: toPlain(events.map((e) => {
      const types = byEvent.get(String(e._id)) || {};
      return { ...e, counts: types, total: Object.values(types).reduce((a, b) => a + b, 0) };
    })),
    signerOptions: await signerOptions(),
    defaultSigners: toPlain(await defaultSigners()),
    today: todayInTimeZone(),
  };
}

export async function getEventBoard(id) {
  assertId(id, 'event');
  await connectDB();
  const event = await CertificateEvent.findById(id).lean();
  if (!event) throw notFound('Event');
  const [certificates, options] = await Promise.all([EventCertificate.find({ event: id }).sort({ type: 1, 'recipient.name': 1 }).lean(), signerOptions()]);
  const sigs = new Map(options.map((o) => [String(o._id), o.hasSignature]));
  return {
    event: toPlain({ ...event, dateText: eventDateText(event), signers: event.signers.map((s) => ({ ...s, hasSignature: Boolean(s.executive && sigs.get(String(s.executive))) })) }),
    certificates: certificates.map(certToClient),
    signerOptions: options,
    types: EVENT_CERT_TYPES.map((t) => ({ ...t, ...wordingFor(event, t.value) })),
  };
}

export async function createEvent(input, { userId } = {}) {
  await connectDB();
  const data = await cleanEvent(input);
  if (!('signers' in input)) data.signers = await defaultSigners();
  const event = await CertificateEvent.create({ ...data, createdBy: userId });
  return toPlain(event.toObject());
}

export async function updateEvent(id, input) {
  assertId(id, 'event');
  const current = await CertificateEvent.findById(id).lean();
  if (!current) throw notFound('Event');
  const data = await cleanEvent({ ...current, ...input }, current);
  const event = await CertificateEvent.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true }).lean();
  return toPlain(event);
}

export async function deleteEvent(id) {
  assertId(id, 'event');
  const event = await CertificateEvent.findByIdAndDelete(id).lean();
  if (!event) throw notFound('Event');
  const { deletedCount } = await EventCertificate.deleteMany({ event: id });
  return toPlain({ ...event, deletedCertificates: deletedCount });
}

// ---------- certificates ----------

function cleanRecipient(r, type) {
  const data = {
    recipient: { name: str(r?.name, 120), institution: str(r?.institution, 160), email: str(r?.email, 160).toLowerCase() },
    detail: str(r?.detail, 160),
  };
  if (!data.recipient.name) throw new HttpError(400, 'Every certificate needs a name.');
  if (data.recipient.email && !EMAIL_RE.test(data.recipient.email)) throw new HttpError(400, `${data.recipient.name}: "${data.recipient.email}" is not a valid email.`);
  const t = EVENT_CERT_TYPE[type];
  if (t.detailRequired && !data.detail) throw new HttpError(400, `${data.recipient.name}: enter the ${t.detailLabel.toLowerCase()}.`);
  return data;
}

// Body: { type, recipients: [{ name, institution?, email?, detail? }] } → certificates (same name + type twice is skipped)
export async function addRecipients(eventId, input = {}, { userId } = {}) {
  assertId(eventId, 'event');
  await connectDB();
  const event = await CertificateEvent.findById(eventId).select('date').lean();
  if (!event) throw notFound('Event');
  const type = EVENT_CERT_TYPE_VALUES.includes(input.type) ? input.type : null;
  if (!type) throw new HttpError(400, 'Choose a certificate type.');
  const list = Array.isArray(input.recipients) ? input.recipients : [];
  if (!list.length) throw new HttpError(400, 'Add at least one name.');
  if (list.length > MAX_RECIPIENTS_PER_ADD) throw new HttpError(400, `Add at most ${MAX_RECIPIENTS_PER_ADD} names at a time.`);
  const rows = list.map((r) => cleanRecipient(r, type));

  const existing = new Set((await EventCertificate.find({ event: eventId, type }).select('recipient.name').lean()).map((c) => c.recipient.name.toLowerCase()));
  const result = { added: 0, skipped: [] };
  for (const row of rows) {
    const key = row.recipient.name.toLowerCase();
    if (existing.has(key)) {
      result.skipped.push(row.recipient.name);
      continue;
    }
    existing.add(key);
    for (let attempt = 0; ; attempt++) {
      try {
        await EventCertificate.create({ ...row, type, event: eventId, code: randomCode(event.date), issuedBy: userId });
        break;
      } catch (error) {
        if (error?.code !== 11000 || attempt >= 4) throw error;
      }
    }
    result.added++;
  }
  return result;
}

// Body: { name?, institution?, email?, detail?, type?, revoked? }
export async function updateEventCertificate(id, input = {}) {
  assertId(id, 'certificate');
  const cert = await EventCertificate.findById(id);
  if (!cert) throw notFound('Certificate');
  if ('type' in input) {
    if (!EVENT_CERT_TYPE_VALUES.includes(input.type)) throw new HttpError(400, 'Choose a certificate type.');
    cert.type = input.type;
  }
  if (['name', 'institution', 'email', 'detail'].some((k) => k in input)) {
    const data = cleanRecipient(
      { name: input.name ?? cert.recipient.name, institution: input.institution ?? cert.recipient.institution, email: input.email ?? cert.recipient.email, detail: input.detail ?? cert.detail },
      cert.type
    );
    cert.recipient = data.recipient;
    cert.detail = data.detail;
  }
  if ('revoked' in input) cert.revoked = input.revoked === true || input.revoked === 'true';
  await cert.save();
  return certToClient(cert.toObject());
}

export async function deleteEventCertificate(id) {
  assertId(id, 'certificate');
  const cert = await EventCertificate.findByIdAndDelete(id).lean();
  if (!cert) throw notFound('Certificate');
  return certToClient(cert);
}

// ---------- PDFs ----------

async function signaturesFor(event) {
  const ids = event.signers.map((s) => s.executive).filter(Boolean);
  if (!ids.length) return {};
  const people = await Executive.find({ _id: { $in: ids } }).select('+signature.data signature.contentType').lean();
  return Object.fromEntries(
    people.filter((p) => p.signature?.data).map((p) => [String(p._id), { data: Buffer.from(p.signature.data.buffer ?? p.signature.data), contentType: p.signature.contentType }])
  );
}

const site = () => siteConfig.url.replace(/\/$/, '');

// Options for certificatePdf() — the shared design, with the event's wording
function pageOptions(cert, event, base, signatures) {
  const type = EVENT_CERT_TYPE[cert.type] || EVENT_CERT_TYPE.participant;
  const wording = wordingFor(event, cert.type);
  const club = base.organization || siteConfig.name;
  const vars = {
    name: cert.recipient.name,
    event: event.title,
    date: eventDateText(event),
    venue: event.venue || '',
    detail: cert.detail || type.label.toLowerCase(),
    institution: cert.recipient.institution || '',
    club,
  };
  const detail = cert.detail && `${type.detailPrefix || ''}${cert.detail}`;
  return {
    certificate: { ...cert, issuedOn: event.issuedOn || event.date, signers: event.signers },
    template: { title: wording.title, organization: club, subtitle: event.organizer || base.subtitle, intro: base.intro || EVENT_INTRO },
    body: fillTemplate(wording.body, vars),
    details: [cert.recipient.institution, cert.type === 'winner' ? '' : detail].filter(Boolean).join('   |   '),
    signatures,
    club,
    verifyUrl: `${site()}${verifyPath(cert.code)}`,
  };
}

const fileSafe = (text) => pdfSafe(text).replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'certificate';

// One certificate — admins, or anyone with the code when the event allows downloads from the verify page
export async function renderEventPdf(code, session) {
  await connectDB();
  const cert = await EventCertificate.findOne({ code: str(code, 40).toUpperCase() }).lean();
  if (!cert) throw notFound('Certificate');
  const event = await CertificateEvent.findById(cert.event).lean();
  if (!event) throw notFound('Event');
  if (session?.role !== 'admin' && !event.publicPdf) throw new HttpError(403, 'Please ask the club for this certificate.');
  if (cert.revoked) throw new HttpError(410, 'This certificate has been revoked.');
  const [base, signatures] = await Promise.all([getSetting('certificate'), signaturesFor(event)]);
  const bytes = await certificatePdf(pageOptions(cert, event, base, signatures));
  return { bytes, fileName: `${fileSafe(cert.recipient.name)}-${fileSafe(event.title)}-certificate.pdf` };
}

// Every valid certificate of an event (optionally one type) in one PDF — admins, for printing
export async function renderEventBundle(eventId, { type } = {}) {
  assertId(eventId, 'event');
  await connectDB();
  const event = await CertificateEvent.findById(eventId).lean();
  if (!event) throw notFound('Event');
  const filter = { event: eventId, revoked: false, ...(EVENT_CERT_TYPE_VALUES.includes(type) && { type }) };
  const certs = await EventCertificate.find(filter).sort({ type: 1, 'recipient.name': 1 }).lean();
  if (!certs.length) throw new HttpError(404, 'No certificates to print yet.');
  const [base, signatures] = await Promise.all([getSetting('certificate'), signaturesFor(event)]);
  const bytes = await certificatesPdf(certs.map((c) => pageOptions(c, event, base, signatures)), { title: `${event.title} - certificates`, club: base.organization || siteConfig.name });
  const suffix = EVENT_CERT_TYPE[type] ? `-${type}s` : '';
  return { bytes, fileName: `${fileSafe(event.title)}${suffix}-certificates.pdf` };
}

// ---------- verify page (every kind of certificate) ----------

// One shape for /certificates/<code>: executive committee or event certificate, or null
export async function verifyCertificate(code) {
  const clean = str(code, 40).toUpperCase();
  if (!clean) return null;
  const executive = await getCertificateByCode(clean);
  if (executive) {
    const r = executive.recipient;
    return {
      kind: 'executive',
      code: executive.code,
      revoked: executive.revoked,
      typeLabel: 'Executive Committee',
      title: 'Certificate of Appreciation',
      name: r.name,
      photo: executive.photo,
      headline: `${executive.role} · ${executive.year}`,
      about: 'It was issued by the club to a member of its executive committee.',
      facts: [
        ['Role', executive.role],
        ['Committee year', executive.year],
        ['Student ID', r.studentId],
        ['Batch', r.batch],
        ['Department', r.department],
        ['Issued on', executive.issuedOn && formatCalendarDate(executive.issuedOn)],
      ].filter(([, v]) => v),
      signers: executive.signers || [],
      pdfUrl: '',
    };
  }
  const cert = await EventCertificate.findOne({ code: clean }).lean();
  if (!cert) return null;
  const event = await CertificateEvent.findById(cert.event).lean();
  if (!event) return null;
  const type = EVENT_CERT_TYPE[cert.type] || EVENT_CERT_TYPE.participant;
  const wording = wordingFor(event, cert.type);
  return toPlain({
    kind: 'event',
    code: cert.code,
    revoked: cert.revoked,
    typeLabel: type.label,
    typeColor: type.color,
    title: wording.title,
    name: cert.recipient.name,
    photo: '',
    headline: [type.label, event.title].join(' · '),
    about: `It was issued by the club for ${event.title}.`,
    facts: [
      ['Event', event.title],
      ['Event date', eventDateText(event)],
      ['Venue', event.venue],
      ['Certificate for', type.label],
      [cert.type === 'winner' ? 'Position' : type.detailLabel.replace(/ \(optional\)$/, ''), cert.detail],
      ['Institution / ID', cert.recipient.institution],
      ['Issued on', formatCalendarDate(event.issuedOn || event.date)],
    ].filter(([, v]) => v),
    signers: event.signers || [],
    pdfUrl: event.publicPdf && !cert.revoked ? eventPdfPath(cert.code) : '',
  });
}
