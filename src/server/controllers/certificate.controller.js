import { NextResponse } from 'next/server';
import { HttpError, created, ok, readJson } from '@/server/http';
import * as certificates from '@/server/services/certificate.service';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Admin: ?year=2026 → signers, student executives with their certificates, wording
export async function board({ query }) {
  return ok(await certificates.getBoard(query.get('year')));
}

// Admin: { year, executives?, issuedOn?, refresh? }
export async function issue({ req, session }) {
  const result = await certificates.issueCertificates(await readJson(req), { userId: session._id });
  const parts = [
    result.issued && `${plural(result.issued, 'certificate')} issued`,
    result.updated && `${plural(result.updated, 'certificate')} updated`,
    result.skipped && `${result.skipped} already issued (skipped)`,
  ].filter(Boolean);
  return created({ ...result, title: `${result.issued + result.updated} certificate(s)` }, `${parts.join(', ')}.`);
}

export async function update({ req, params }) {
  const cert = await certificates.updateCertificate(params.id, await readJson(req));
  return ok(cert, cert.revoked ? 'Certificate revoked.' : 'Certificate saved.');
}

export async function remove({ params }) {
  return ok(await certificates.deleteCertificate(params.id), 'Certificate deleted.');
}

// Admin or the certificate holder: the PDF (inline; ?download=1 → save as file)
export async function pdf({ params, query, session }) {
  const { bytes, fileName } = await certificates.renderPdf(params.code, session);
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${query.get('download') ? 'attachment' : 'inline'}; filename="${fileName}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// Signed in: own certificates (Account → Certificates)
export async function mine({ session }) {
  return ok(await certificates.getCertificatesForUser(session._id));
}

// ---- faculty signatures (admin) ----

async function formData(req) {
  try {
    return await req.formData();
  } catch {
    throw new HttpError(400, 'Send the signature as multipart form data.');
  }
}

export async function signature({ params }) {
  const { data, contentType } = await certificates.getSignature(params.id);
  return new NextResponse(data, { headers: { 'Content-Type': contentType, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export async function setSignature({ req, params }) {
  return ok(await certificates.setSignature(params.id, await formData(req)), 'Signature saved.');
}

export async function removeSignature({ params }) {
  return ok(await certificates.removeSignature(params.id), 'Signature removed.');
}
