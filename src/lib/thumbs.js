// Small copies of public photos for avatars and cards (server-only). `npm run build:cpanel-npm` writes them to
// public/_thumbs/<same path>.webp (240 px, ~10 KB instead of 50–120 KB). When a copy exists its URL is returned,
// otherwise the original's — in development and for uploaded photos (already resized when uploaded).
import fs from 'node:fs';
import path from 'node:path';

const known = new Map();

export function thumb(src) {
  if (typeof src !== 'string' || !src.startsWith('/') || src.startsWith('//') || src.startsWith('/_thumbs/') || src.startsWith('/uploads/')) return src;
  if (!known.has(src)) {
    let result = src;
    try {
      const rel = `/_thumbs${decodeURIComponent(src.split('?')[0]).replace(/\.[^./]+$/, '')}.webp`;
      if (fs.existsSync(path.join(process.cwd(), 'public', rel))) result = encodeURI(rel);
    } catch {
      /* malformed URL — keep the original */
    }
    known.set(src, result);
  }
  return known.get(src);
}
