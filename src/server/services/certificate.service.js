// Certificates for student executives (Dashboard → Certificates), one per person per committee year.
// Signed by that year's top 3 faculty advisors (lowest committee `order` first) — fewer if fewer serve.
// Each certificate has a code (SACC-2026-7KQ4MZ) and a QR code that opens /certificates/<code> (public verify page).
// The PDF itself is private: admins and the person it belongs to (Account → Certificates).
import crypto from 'node:crypto';
import connectDB from '@/lib/db';
import Certificate from '@/models/Certificate';
import Executive from '@/models/Executive';
import CommitteePosition from '@/models/CommitteePosition';
import StudentProfile from '@/models/StudentProfile';
import AlumniProfile from '@/models/AlumniProfile';
import { siteConfig } from '@/config/site';
import { certificatePdf, pdfSafe } from '@/lib/certificate-pdf';
import { todayInTimeZone } from '@/lib/timezone';
import { getSetting } from '@/server/services/settings.service';
import { getYears } from '@/server/services/executive.service';
import { HttpError } from '@/server/http';
import { assertId, notFound, str, toPlain } from '@/server/validate';

export const MAX_SIGNERS = 3;
const SIGNATURE_MAX_BYTES = 1024 * 1024;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const randomCode = (year) => `${siteConfig.shortName}-${year}-${Array.from({ length: 6 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('')}`;
export const verifyPath = (code) => `/certificates/${code}`;
export const pdfPath = (code) => `/api/certificates/pdf/${code}`;

const toClient = (c) => toPlain({ ...c, name: c.recipient?.name || '', verifyUrl: verifyPath(c.code), pdfUrl: pdfPath(c.code) });

// ---------- who is on a year's certificates ----------

// Top 3 faculty advisors of the year (people with kind 'faculty' or advisor positions)
async function signersFor(year) {
  const rows = await CommitteePosition.find({ year, type: 'advisor' })
    .sort({ order: 1, createdAt: 1 })
    .populate('executive', 'name designation department signature.contentType signature.version')
    .lean();
  const seen = new Set();
  return rows
    .filter((p) => p.executive && !seen.has(String(p.executive._id)) && seen.add(String(p.executive._id)))
    .slice(0, MAX_SIGNERS)
    .map(({ role, executive: e }) => ({
      executive: e._id,
      name: e.name,
      role,
      designation: e.designation || '',
      department: e.department || '',
      hasSignature: Boolean(e.signature?.contentType),
      signatureVersion: e.signature?.version || 0,
    }));
}

// Student executives of the year — one entry per person, every role they held joined
async function studentExecutivesFor(year) {
  const rows = await CommitteePosition.find({ year, type: 'executive' })
    .sort({ order: 1, createdAt: 1 })
    .populate('executive', 'name slug photo kind studentId batch department shift')
    .lean();
  const people = new Map();
  for (const p of rows) {
    if (!p.executive || p.executive.kind === 'faculty') continue;
    const id = String(p.executive._id);
    if (people.has(id)) people.get(id).roles.push(p.role);
    else people.set(id, { person: p.executive, roles: [p.role], order: p.order });
  }
  return [...people.values()];
}

const recipientOf = (person) => ({
  name: person.name, studentId: person.studentId || '', batch: person.batch || '', department: person.department || '', shift: person.shift || '',
});
const signerSnapshot = ({ executive, name, role, designation, department }) => ({ executive, name, role, designation, department });

// ---------- admin ----------

// Everything Dashboard → Certificates shows for one year
export async function getBoard(yearInput) {
  await connectDB();
  const years = await getYears();
  const year = Number(yearInput) || years[0] || new Date().getFullYear();
  const [signers, members, certificates, template] = await Promise.all([
    signersFor(year),
    studentExecutivesFor(year),
    Certificate.find({ year }).lean(),
    getSetting('certificate'),
  ]);
  const byPerson = new Map(certificates.map((c) => [String(c.executive), c]));
  const executives = members.map(({ person, roles }) => {
    const cert = byPerson.get(String(person._id));
    return toPlain({ ...person, role: roles.join(' & '), certificate: cert ? toClient(cert) : null });
  });
  return { years, year, signers: toPlain(signers), executives, template, today: todayInTimeZone() };
}

// Issues certificates for a year: { year, executives?: [ids] (default: all), issuedOn?, refresh? }
// Already issued ones are skipped, or with refresh: true updated (name, role, signers, date — the code stays).
export async function issueCertificates(input, { userId } = {}) {
  await connectDB();
  const year = Number(input.year);
  if (!Number.isInteger(year) || year < 1990 || year > 2100) throw new HttpError(400, 'Choose a committee year.');
  const issuedOn = str(input.issuedOn, 10) || todayInTimeZone();
  if (!DATE_RE.test(issuedOn) || Number.isNaN(Date.parse(issuedOn))) throw new HttpError(400, 'Enter a valid issue date.');

  const signers = await signersFor(year);
  if (!signers.length) throw new HttpError(400, `Add at least one Faculty Advisor to the ${year} committee first — they sign the certificates.`);

  let members = await studentExecutivesFor(year);
  if (Array.isArray(input.executives)) {
    const wanted = new Set(input.executives.map(String));
    members = members.filter(({ person }) => wanted.has(String(person._id)));
  }
  if (!members.length) throw new HttpError(400, `No student executives found in the ${year} committee.`);

  const existing = new Map((await Certificate.find({ year, executive: { $in: members.map((m) => m.person._id) } }).lean()).map((c) => [String(c.executive), c]));
  const result = { issued: 0, updated: 0, skipped: 0 };
  for (const { person, roles } of members) {
    const data = { role: roles.join(' & '), recipient: recipientOf(person), signers: signers.map(signerSnapshot), issuedOn };
    const current = existing.get(String(person._id));
    if (current) {
      if (!input.refresh) {
        result.skipped++;
        continue;
      }
      await Certificate.updateOne({ _id: current._id }, { $set: { ...data, revoked: false, issuedBy: userId } });
      result.updated++;
      continue;
    }
    // Retry on the (very unlikely) duplicate code
    for (let attempt = 0; ; attempt++) {
      try {
        await Certificate.create({ ...data, code: randomCode(year), executive: person._id, year, issuedBy: userId });
        break;
      } catch (error) {
        if (error?.code !== 11000 || !error.keyPattern?.code || attempt >= 4) throw error;
      }
    }
    result.issued++;
  }
  return result;
}

export async function updateCertificate(id, input) {
  assertId(id, 'certificate');
  const set = {};
  if ('revoked' in input) set.revoked = input.revoked === true || input.revoked === 'true';
  if ('issuedOn' in input) {
    const issuedOn = str(input.issuedOn, 10);
    if (!DATE_RE.test(issuedOn) || Number.isNaN(Date.parse(issuedOn))) throw new HttpError(400, 'Enter a valid issue date.');
    set.issuedOn = issuedOn;
  }
  const cert = await Certificate.findByIdAndUpdate(id, { $set: set }, { returnDocument: 'after' }).lean();
  if (!cert) throw notFound('Certificate');
  return toClient(cert);
}

export async function deleteCertificate(id) {
  assertId(id, 'certificate');
  const cert = await Certificate.findByIdAndDelete(id).lean();
  if (!cert) throw notFound('Certificate');
  return toClient(cert);
}

// ---------- faculty signatures ----------

function sniffSignature(buf) {
  if (buf.length > 4 && buf.readUInt32BE(0) === 0x89504e47) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  return null;
}

export async function setSignature(executiveId, form) {
  assertId(executiveId, 'person');
  const file = form.get('signature');
  if (!file || typeof file === 'string' || !file.size) throw new HttpError(400, 'Choose a signature image.');
  if (file.size > SIGNATURE_MAX_BYTES) throw new HttpError(400, 'The signature image must be 1 MB or smaller.');
  const data = Buffer.from(await file.arrayBuffer());
  const contentType = sniffSignature(data);
  if (!contentType) throw new HttpError(400, 'The signature must be a PNG (best: transparent background) or JPG image.');
  const person = await Executive.findByIdAndUpdate(
    executiveId,
    { $set: { 'signature.data': data, 'signature.contentType': contentType, 'signature.size': data.length }, $inc: { 'signature.version': 1 } },
    { returnDocument: 'after' }
  ).lean();
  if (!person) throw notFound('Person');
  return toPlain({ _id: person._id, name: person.name, signature: person.signature });
}

export async function removeSignature(executiveId) {
  assertId(executiveId, 'person');
  const person = await Executive.findByIdAndUpdate(
    executiveId,
    { $unset: { 'signature.data': 1 }, $set: { 'signature.contentType': '', 'signature.size': 0 }, $inc: { 'signature.version': 1 } },
    { returnDocument: 'after' }
  ).lean();
  if (!person) throw notFound('Person');
  return toPlain({ _id: person._id, name: person.name, signature: person.signature });
}

export async function getSignature(executiveId) {
  assertId(executiveId, 'person');
  const person = await Executive.findById(executiveId).select('+signature.data signature.contentType').lean();
  if (!person?.signature?.data) throw notFound('Signature');
  return { data: Buffer.from(person.signature.data.buffer ?? person.signature.data), contentType: person.signature.contentType };
}

// ---------- public ----------

const cleanCode = (code) => str(code, 40).toUpperCase();

// For the verify page (revoked certificates are returned too, so the page can say so)
export async function getCertificateByCode(code) {
  await connectDB();
  const cert = await Certificate.findOne({ code: cleanCode(code) }).populate('executive', 'slug photo').lean();
  if (!cert) return null;
  const { executive, ...rest } = cert;
  return toClient({ ...rest, executive: executive?._id, slug: executive?.slug || '', photo: executive?.photo || '' });
}

// Executive records that belong to a signed-in user: linked to the login, or with the same student ID
// as the user's student / alumni profile
async function executiveIdsForUser(userId) {
  const profiles = await Promise.all([
    StudentProfile.findOne({ user: userId }).select('studentId').lean(),
    AlumniProfile.findOne({ user: userId }).select('studentId').lean(),
  ]);
  const studentIds = [...new Set(profiles.map((p) => p?.studentId?.trim()).filter(Boolean))];
  const people = await Executive.find({ $or: [{ user: userId }, ...(studentIds.length ? [{ studentId: { $in: studentIds } }] : [])] }).select('_id').lean();
  return people.map((p) => p._id);
}

// Account → Certificates: the signed-in user's valid certificates, newest first
export async function getCertificatesForUser(userId) {
  await connectDB();
  const ids = await executiveIdsForUser(userId);
  if (!ids.length) return [];
  const rows = await Certificate.find({ executive: { $in: ids }, revoked: false }).sort({ year: -1 }).select('code year role issuedOn recipient.name').lean();
  return rows.map(toClient);
}

// PDF bytes + a file name — admins, or the person the certificate belongs to. Revoked certificates have no PDF.
export async function renderPdf(code, session) {
  await connectDB();
  const cert = await Certificate.findOne({ code: cleanCode(code) }).lean();
  if (!cert) throw notFound('Certificate');
  if (session?.role !== 'admin') {
    const own = await executiveIdsForUser(session?._id);
    if (!own.some((id) => String(id) === String(cert.executive))) throw new HttpError(403, 'Only the certificate holder can open this certificate.');
  }
  if (cert.revoked) throw new HttpError(410, 'This certificate has been revoked.');
  const ids = cert.signers.map((s) => s.executive).filter(Boolean);
  const [people, template] = await Promise.all([
    Executive.find({ _id: { $in: ids } }).select('+signature.data signature.contentType').lean(),
    getSetting('certificate'),
  ]);
  const signatures = Object.fromEntries(
    people.filter((p) => p.signature?.data).map((p) => [String(p._id), { data: Buffer.from(p.signature.data.buffer ?? p.signature.data), contentType: p.signature.contentType }])
  );
  const bytes = await certificatePdf({
    certificate: cert,
    template,
    signatures,
    club: siteConfig.name,
    verifyUrl: `${siteConfig.url.replace(/\/$/, '')}${verifyPath(cert.code)}`,
  });
  const fileName = `${pdfSafe(cert.recipient.name).replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'certificate'}-${cert.year}-certificate.pdf`;
  return { bytes, fileName };
}
