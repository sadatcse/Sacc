// Image uploads for every photo field (news covers and article images, executive / alumni / profile photos,
// About page photo…). Files are re-encoded to WebP (when sharp is available) and saved on disk in UPLOAD_DIR (default <app>/uploads),
// served by app/uploads/[...path]/route.js at /uploads/<folder>/<yyyy>/<mm>/<name>.webp.
// Not in public/: Next.js only serves public files that existed at build time, so runtime uploads (cPanel) live
// outside it. Keep the uploads folder when you redeploy — it's the only copy of the pictures.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from '@/server/http';
import { str } from '@/server/validate';
import { encodeImage } from '@/lib/image-encode';

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // before re-encoding

// Folder → longest side after re-encoding. Members (non-admins) may only upload their own profile photo.
export const UPLOAD_FOLDERS = {
  news: 2000,
  about: 2000,
  general: 2000,
  executives: 1000,
  alumni: 1000,
  profiles: 1000,
};
const MEMBER_FOLDERS = ['profiles'];

const CONTENT_TYPES = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.avif': 'image/avif' };

// multipart: file, folder? → { url, width, height, size }
export async function saveImage(form, { session }) {
  const file = form.get('file');
  if (!file || typeof file === 'string' || !file.size) throw new HttpError(400, 'Choose an image to upload.');
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(400, 'The image must be 10 MB or smaller.');
  const folder = UPLOAD_FOLDERS[str(form.get('folder'), 20)] ? str(form.get('folder'), 20) : 'general';
  if (session.role !== 'admin' && !MEMBER_FOLDERS.includes(folder)) throw new HttpError(403, 'You can only upload your profile photo.');

  // WebP via sharp; on servers without sharp the original JPEG / PNG / WebP / GIF is kept (src/lib/image-encode.js)
  const encoded = await encodeImage(Buffer.from(await file.arrayBuffer()), { maxEdge: UPLOAD_FOLDERS[folder] });
  if (!encoded) throw new HttpError(400, 'That file is not an image we can read. Use JPG, PNG, WebP or GIF.');

  const now = new Date();
  const dir = [folder, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0')];
  const name = `${now.getTime().toString(36)}-${crypto.randomBytes(5).toString('hex')}${encoded.ext}`;
  await fs.mkdir(path.join(UPLOAD_DIR, ...dir), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, ...dir, name), encoded.data);
  return { url: `/uploads/${[...dir, name].join('/')}`, width: encoded.width, height: encoded.height, size: encoded.data.length };
}

// /uploads/<...parts> → { data, contentType } or null (only plain names inside UPLOAD_DIR, images only)
export async function readUpload(parts = []) {
  if (!parts.length || parts.some((p) => !/^[\w.-]+$/.test(p) || p.startsWith('.'))) return null;
  const full = path.resolve(UPLOAD_DIR, ...parts);
  if (!full.startsWith(UPLOAD_DIR + path.sep)) return null;
  const contentType = CONTENT_TYPES[path.extname(full).toLowerCase()];
  if (!contentType) return null;
  try {
    return { data: await fs.readFile(full), contentType };
  } catch {
    return null;
  }
}
