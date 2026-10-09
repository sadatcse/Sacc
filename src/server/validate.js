// Input cleaning for request bodies. Every service runs incoming data through `clean()` so
// only known fields of the right type ever reach Mongoose.
import mongoose from 'mongoose';
import { HttpError } from './http';
import { LINK_KEYS } from '@/models/shared';
import { slugify } from '@/lib/utils';

export const str = (value, max = 500) => (value === undefined || value === null ? '' : String(value).trim().slice(0, max));

// "a, b, c" or ['a', 'b'] → ['a', 'b', 'c']
export const list = (value, max = 30) =>
  (Array.isArray(value) ? value : String(value ?? '').split(','))
    .map((v) => str(v, 80))
    .filter(Boolean)
    .slice(0, max);

// Profile links: web addresses must be http(s) (no `javascript:` or '#' placeholders), `email` a real address.
// Anything else is dropped. A bare domain like "github.com/x" gets https:// added.
export const links = (value = {}) =>
  Object.fromEntries(
    LINK_KEYS.map((key) => {
      let v = str(value?.[key], 300);
      if (key === 'email') return [key, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v.toLowerCase() : ''];
      if (v && !/^[a-z][a-z\d+.-]*:/i.test(v) && /^[\w-]+(\.[\w-]+)+(\/|$)/.test(v)) v = `https://${v}`;
      return [key, /^https?:\/\/[^\s]+\.[^\s]+/i.test(v) ? v : ''];
    })
  );

// "one per line" text or an array → trimmed items (for entries that may contain commas)
export const lines = (value, max = 30) =>
  (Array.isArray(value) ? value : String(value ?? '').split(/\r?\n/))
    .map((v) => str(v, 300))
    .filter(Boolean)
    .slice(0, max);

// Array of small objects with known string fields: rows(value, { title: 120, company: 120 })
export const rows = (value, shape, max = 20) =>
  (Array.isArray(value) ? value : [])
    .slice(0, max)
    .map((row) => Object.fromEntries(Object.entries(shape).map(([key, len]) => [key, str(row?.[key], len)])))
    .filter((row) => Object.values(row).some(Boolean));

const ROW_SHAPES = {
  experience: { title: 120, company: 120, location: 120, start: 20, end: 20, description: 600 },
  education: { degree: 160, institution: 160, start: 20, end: 20 },
};

const CLEANERS = {
  text: (v) => str(v, 200),
  longtext: (v) => str(v, 5000),
  url: (v) => str(v, 500),
  number: (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
  boolean: (v) => v === true || v === 'true' || v === 'on',
  list: (v) => list(v),
  links: (v) => links(v),
  lines: (v) => lines(v),
  shift: (v) => (['day', 'evening'].includes(String(v).toLowerCase()) ? String(v).toLowerCase() : ''),
  experience: (v) => rows(v, ROW_SHAPES.experience),
  education: (v) => rows(v, ROW_SHAPES.education),
};

// fields = { name: 'text', bio: 'longtext', skills: 'list', ... } — types: text, longtext, url, number, boolean,
// list (comma separated), lines (one per line), links, shift, experience, education. Keys missing from `input` are skipped,
// so the result is safe for partial updates.
export function clean(input = {}, fields) {
  const out = {};
  for (const [key, type] of Object.entries(fields)) {
    if (!(key in input)) continue;
    const value = CLEANERS[type](input[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function assertId(id, label = 'record') {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, `Invalid ${label} id.`);
}

export function notFound(label) {
  return new HttpError(404, `${label} not found.`);
}

export function makeSlug(value) {
  const slug = slugify(value).slice(0, 80).replace(/^-+|-+$/g, '');
  if (!slug) throw new HttpError(400, 'Could not build a URL slug — add a title or name with letters or numbers.');
  return slug;
}

// Lean Mongoose docs → plain JSON (ObjectIds and Dates become strings) for client components
export const toPlain = (value) => JSON.parse(JSON.stringify(value));
