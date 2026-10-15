// Server-only: draws certificates as A4 landscape PDFs (pdf-lib, standard fonts) — student executive
// certificates and event certificates (participants, winners, speakers, guests…) share the design.
//   const bytes = await certificatePdf({ certificate, template, signatures, verifyUrl, club, body?, details? });
//   const bytes = await certificatesPdf([...same options per page], { title, club });   // one page each
// `signatures` maps a signer's executive id → { data, contentType } (PNG / JPG). Signers without one get an
// empty line to sign by hand. A QR code (bottom left) opens the verify page for the certificate.
// `body` / `details` (optional) replace the text built from an executive certificate's recipient.
import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import { formatCalendarDate } from '@/lib/utils';

const W = 841.89;
const H = 595.28;
const INK = rgb(0.12, 0.15, 0.21);
const MUTED = rgb(0.4, 0.42, 0.47);
const ORANGE = rgb(0.976, 0.451, 0.086);
const RED = rgb(0.863, 0.149, 0.149);
const GOLD = rgb(0.8, 0.6, 0.25);
const PAPER = rgb(1, 0.993, 0.975);

// The standard PDF fonts only cover Latin-1: swap typographic marks, drop anything else
export function pdfSafe(text = '') {
  return String(text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// "{role} of {club}" → values; unknown placeholders stay as written
export const fillTemplate = (text, vars) => String(text || '').replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m));

function wrap(text, font, size, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// Largest size ≤ `size` at which the text fits on one line
function fit(text, font, size, maxWidth, min = 7) {
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return size;
}

function centered(page, text, { y, font, size, color = INK, x = W / 2, maxWidth = W - 160 }) {
  const t = pdfSafe(text);
  if (!t) return;
  const s = fit(t, font, size, maxWidth);
  page.drawText(t, { x: x - font.widthOfTextAtSize(t, s) / 2, y, size: s, font, color });
}

// Logos printed in the header: the university (public/university-logo.png) and the club (public/logo.png)
const logoCache = new Map();
async function readPublicFile(name) {
  if (!logoCache.has(name)) logoCache.set(name, await fs.readFile(path.join(process.cwd(), 'public', name)).catch(() => null));
  return logoCache.get(name);
}

async function embedImage(pdf, { data, contentType } = {}) {
  if (!data) return null;
  try {
    return contentType === 'image/png' ? await pdf.embedPng(data) : await pdf.embedJpg(data);
  } catch {
    return null;
  }
}

// QR code as vector squares (sharp at any zoom); (x, y) = bottom-left corner
function drawQr(page, text, { x, y, size }) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const unit = size / modules.size;
  page.drawRectangle({ x: x - 3, y: y - 3, width: size + 6, height: size + 6, color: rgb(1, 1, 1) });
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) page.drawRectangle({ x: x + col * unit, y: y + size - (row + 1) * unit, width: unit + 0.05, height: unit + 0.05, color: INK });
    }
  }
}

// Fonts, logos and signature images are embedded once per document and reused on every page
async function documentAssets(pdf) {
  const [sans, sansBold, serif, serifBold, serifItalic, serifBoldItalic] = await Promise.all(
    [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic, StandardFonts.TimesRomanBoldItalic].map((f) => pdf.embedFont(f))
  );
  const [university, clubLogo] = await Promise.all(
    ['university-logo.png', 'logo.png'].map(async (name) => embedImage(pdf, { data: await readPublicFile(name), contentType: 'image/png' }))
  );
  return { font: { sans, sansBold, serif, serifBold, serifItalic, serifBoldItalic }, university, clubLogo, signatures: new Map() };
}

async function signatureImage(pdf, assets, id, signature) {
  if (!signature) return null;
  if (!assets.signatures.has(id)) assets.signatures.set(id, await embedImage(pdf, signature));
  return assets.signatures.get(id);
}

function setInfo(pdf, title, club, subject) {
  pdf.setTitle(pdfSafe(title));
  pdf.setAuthor(pdfSafe(club));
  if (subject) pdf.setSubject(pdfSafe(subject));
  pdf.setCreator(pdfSafe(club));
}

export async function certificatePdf(options) {
  const pdf = await PDFDocument.create();
  const { certificate: c, template, club } = options;
  setInfo(pdf, `${template.title} - ${c.recipient.name}${c.year ? ` (${c.year})` : ''}`, club, `Certificate ${c.code}`);
  await drawCertificate(pdf, await documentAssets(pdf), options);
  return pdf.save();
}

// Many certificates in one PDF (one page each) — for printing a whole event at once
export async function certificatesPdf(pages, { title, club }) {
  const pdf = await PDFDocument.create();
  setInfo(pdf, title, club);
  const assets = await documentAssets(pdf);
  for (const options of pages) await drawCertificate(pdf, assets, options);
  return pdf.save();
}

async function drawCertificate(pdf, assets, { certificate: c, template, signatures = {}, verifyUrl, club, body: filledBody, details: detailsText }) {
  const page = pdf.addPage([W, H]);
  const { font, university, clubLogo } = assets;

  // Paper, corner accents, double frame
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
  page.drawSvgPath('M0 0 L90 0 L0 90 Z', { x: 18, y: H - 18, color: ORANGE });
  page.drawSvgPath('M0 0 L54 0 L0 54 Z', { x: 18, y: H - 18, color: RED });
  page.drawSvgPath('M0 0 L-90 0 L0 -90 Z', { x: W - 18, y: 18, color: ORANGE });
  page.drawSvgPath('M0 0 L-54 0 L0 -54 Z', { x: W - 18, y: 18, color: RED });
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: ORANGE, borderWidth: 3 });
  page.drawRectangle({ x: 28, y: 28, width: W - 56, height: H - 56, borderColor: GOLD, borderWidth: 0.8 });

  // Header: club logo (centre), university logo (top-right corner — the corner without an accent)
  if (clubLogo) {
    const h = 54;
    const w = (clubLogo.width / clubLogo.height) * h;
    page.drawImage(clubLogo, { x: (W - w) / 2, y: H - 98, width: w, height: h });
  }
  if (university) {
    const h = 64;
    const w = (university.width / university.height) * h;
    page.drawImage(university, { x: W - 52 - w, y: H - 52 - h, width: w, height: h });
  }
  centered(page, (template.organization || club).toUpperCase(), { y: H - 120, font: font.sansBold, size: 17 });
  centered(page, template.subtitle, { y: H - 136, font: font.sans, size: 10.5, color: MUTED });

  // Title, recipient
  centered(page, template.title.toUpperCase(), { y: H - 186, font: font.serifBold, size: 32, color: ORANGE });
  page.drawLine({ start: { x: W / 2 - 90, y: H - 198 }, end: { x: W / 2 + 90, y: H - 198 }, thickness: 1, color: GOLD });
  centered(page, template.intro, { y: H - 224, font: font.serifItalic, size: 14, color: MUTED });
  centered(page, c.recipient.name, { y: H - 268, font: font.serifBoldItalic, size: 38, maxWidth: 600 });
  page.drawLine({ start: { x: W / 2 - 230, y: H - 280 }, end: { x: W / 2 + 230, y: H - 280 }, thickness: 1, color: ORANGE });
  const r = c.recipient;
  const details = detailsText ?? [r.studentId && `ID: ${r.studentId}`, r.batch && `Batch: ${r.batch}`, r.department].filter(Boolean).join('   |   ');
  centered(page, details, { y: H - 296, font: font.sans, size: 10, color: MUTED });

  // Main text
  const vars = {
    name: r.name, role: c.role, year: String(c.year), club: template.organization || club,
    batch: r.batch, department: r.department, studentId: r.studentId,
  };
  const body = pdfSafe(filledBody ?? fillTemplate(template.body, vars));
  let size = 14;
  let lines = wrap(body, font.serif, size, 620);
  while (lines.length > 3 && size > 10) lines = wrap(body, font.serif, (size -= 1), 620);
  lines.forEach((line, i) => {
    page.drawText(line, { x: (W - font.serif.widthOfTextAtSize(line, size)) / 2, y: H - 326 - i * (size + 5), size, font: font.serif, color: INK });
  });

  // Signatures: the year's top faculty advisors (1–3), spread evenly
  const signers = c.signers.slice(0, 3);
  const gap = signers.length === 3 ? 240 : 300;
  for (const [i, s] of signers.entries()) {
    const x = W / 2 + (i - (signers.length - 1) / 2) * gap;
    const lineY = 150;
    const image = await signatureImage(pdf, assets, String(s.executive), signatures[String(s.executive)]);
    if (image) {
      const scale = Math.min(150 / image.width, 44 / image.height);
      const w = image.width * scale;
      page.drawImage(image, { x: x - w / 2, y: lineY + 3, width: w, height: image.height * scale });
    }
    page.drawLine({ start: { x: x - 85, y: lineY }, end: { x: x + 85, y: lineY }, thickness: 0.8, color: INK });
    centered(page, s.name, { x, y: lineY - 13, font: font.sansBold, size: 10.5, maxWidth: 200 });
    centered(page, s.role, { x, y: lineY - 25, font: font.sans, size: 9, color: ORANGE, maxWidth: 200 });
    centered(page, s.designation, { x, y: lineY - 36, font: font.sans, size: 8.5, color: MUTED, maxWidth: 200 });
    centered(page, s.department, { x, y: lineY - 46, font: font.sans, size: 8, color: MUTED, maxWidth: 200 });
  }

  // Footer: QR code → verify page (bottom left), issue date and certificate ID (bottom right)
  const qrSize = 62;
  drawQr(page, verifyUrl, { x: 52, y: 48, size: qrSize });
  centered(page, 'Scan to verify', { x: 52 + qrSize / 2, y: 36, font: font.sans, size: 7.5, color: MUTED });
  const right = W - 112;
  const footer = [
    [c.issuedOn && `Issued on ${formatCalendarDate(c.issuedOn)}`, font.sansBold, 9, INK],
    [`Certificate ID: ${c.code}`, font.sans, 8.5, INK],
  ];
  footer.forEach(([text, f, s, color], i) => {
    const t = pdfSafe(text);
    if (t) page.drawText(t, { x: right - f.widthOfTextAtSize(t, s), y: 66 - i * 13, size: s, font: f, color });
  });
}
