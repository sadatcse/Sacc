// Photo gallery (Dashboard → Gallery → /gallery and the home page preview).
// Photos are uploads (stored in MongoDB), files from public/gallery, or images picked from news posts.
import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import sharp from 'sharp';
import connectDB from '@/lib/db';
import GalleryPhoto from '@/models/GalleryPhoto';
import Post from '@/models/Post';
import { DEFAULT_ALBUM, imageSize, scanGalleryFolder } from '@/lib/gallery';
import { HttpError } from '@/server/http';
import { assertId, notFound, str, toPlain } from '@/server/validate';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // before re-encoding
const MAX_EDGE = 2000; // longest side after re-encoding
const NOT_DELETED = { deletedAt: { $exists: false } };

// Public URL of a photo. Uploads carry their version in the path, so a replaced picture gets a new URL.
const srcOf = (p) => (p.source === 'upload' || p.image?.contentType ? `/api/gallery/image/${p._id}/${p.version || 1}` : p.src);

function toPublic(p) {
  return { id: String(p._id), src: srcOf(p), width: p.width, height: p.height, album: p.album || DEFAULT_ALBUM, caption: p.caption || null };
}

function toAdmin(p) {
  const { image, ...rest } = p;
  return toPlain({ ...rest, src: srcOf(p), stored: Boolean(image?.contentType), size: image?.size || 0 });
}

// ---------- folder import ----------

// Syncs the gallery with public/gallery (Dashboard → "Import from folder"):
//   new files are added, folder photos deleted earlier are brought back while their file is still there,
//   and records whose file was removed from the folder are cleaned up (they would show a broken image).
export async function importFolder({ userId } = {}) {
  const files = scanGalleryFolder();
  const onDisk = new Set(files.map((f) => f.src));
  const records = await GalleryPhoto.find({ source: 'folder' }).select('src deletedAt').lean();
  const known = new Set(records.map((p) => p.src));

  const stale = records.filter((p) => !onDisk.has(p.src)).map((p) => p._id);
  const removed = stale.length ? (await GalleryPhoto.deleteMany({ _id: { $in: stale } })).deletedCount : 0;
  const restored = (await GalleryPhoto.updateMany({ source: 'folder', src: { $in: [...onDisk] }, deletedAt: { $exists: true } }, { $unset: { deletedAt: 1 } })).modifiedCount;

  const fresh = files.filter((f) => !known.has(f.src));
  if (fresh.length) {
    await GalleryPhoto.insertMany(
      fresh.map((f) => ({
        source: 'folder',
        src: f.src,
        width: f.width,
        height: f.height,
        album: f.album,
        caption: f.caption || '',
        createdBy: userId,
        createdAt: new Date(f.modified),
        updatedAt: new Date(f.modified),
      })),
      { timestamps: false }
    );
  }
  return { added: fresh.length, restored, removed, total: files.length };
}

// First visit after the switch to the database: bring the existing folder photos in once
let importChecked = false;
async function ensureImported() {
  if (importChecked) return;
  importChecked = true;
  if ((await GalleryPhoto.estimatedDocumentCount()) === 0) await importFolder();
}

// ---------- public ----------

// Visible photos, pinned first then newest. Cached per request.
export const getGalleryPhotos = cache(async () => {
  await connectDB();
  await ensureImported();
  const rows = await GalleryPhoto.find({ ...NOT_DELETED, hidden: { $ne: true } }).sort({ featured: -1, createdAt: -1 }).lean();
  return rows.map(toPublic);
});

export async function getImage(id) {
  assertId(id, 'photo');
  const row = await GalleryPhoto.findOne({ _id: id, ...NOT_DELETED }).select('+image.data image.contentType').lean();
  if (!row?.image?.data) throw notFound('Photo');
  return { data: Buffer.from(row.image.data.buffer ?? row.image.data), contentType: row.image.contentType };
}

// ---------- admin ----------

export async function listPhotos() {
  await ensureImported();
  const rows = await GalleryPhoto.find(NOT_DELETED).sort({ featured: -1, createdAt: -1 }).populate('post', 'title slug').lean();
  return rows.map(toAdmin);
}

export async function albumNames() {
  return (await GalleryPhoto.distinct('album', NOT_DELETED)).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

// Any image (JPEG / PNG / WebP / GIF / HEIC…) → upright WebP, at most 2000 px, metadata stripped
async function encode(file) {
  if (!file || typeof file === 'string' || !file.size) throw new HttpError(400, 'Choose a photo to upload.');
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(400, 'The photo must be 10 MB or smaller.');
  const input = Buffer.from(await file.arrayBuffer());
  try {
    const { data, info } = await sharp(input, { failOn: 'error' })
      .rotate() // apply EXIF orientation
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return { image: { data, contentType: 'image/webp', size: data.length }, width: info.width, height: info.height };
  } catch {
    throw new HttpError(400, 'That file is not an image we can read. Use JPG, PNG or WebP.');
  }
}

const cleanMeta = (input = {}) => ({
  ...(input.caption !== undefined && { caption: str(input.caption, 200) }),
  ...(input.album !== undefined && { album: str(input.album, 80) || DEFAULT_ALBUM }),
  ...(input.hidden !== undefined && { hidden: input.hidden === true || input.hidden === 'true' }),
  ...(input.featured !== undefined && { featured: input.featured === true || input.featured === 'true' }),
});

// One photo per request (multipart: photo, caption?, album?)
export async function uploadPhoto(form, { userId } = {}) {
  const encoded = await encode(form.get('photo'));
  const row = await GalleryPhoto.create({
    source: 'upload',
    ...encoded,
    ...cleanMeta({ caption: form.get('caption') ?? '', album: form.get('album') ?? DEFAULT_ALBUM }),
    createdBy: userId,
  });
  return toAdmin(row.toObject());
}

// "Change picture": any photo (upload, folder or news) gets a new stored image
export async function replaceImage(id, form) {
  assertId(id, 'photo');
  const encoded = await encode(form.get('photo'));
  const row = await GalleryPhoto.findOneAndUpdate(
    { _id: id, ...NOT_DELETED },
    { $set: { ...encoded, source: 'upload', src: '' }, $inc: { version: 1 } },
    { returnDocument: 'after' }
  ).lean();
  if (!row) throw notFound('Photo');
  return toAdmin(row);
}

export async function updatePhoto(id, input) {
  assertId(id, 'photo');
  const row = await GalleryPhoto.findOneAndUpdate({ _id: id, ...NOT_DELETED }, { $set: cleanMeta(input) }, { returnDocument: 'after' })
    .populate('post', 'title slug')
    .lean();
  if (!row) throw notFound('Photo');
  return toAdmin(row);
}

export async function deletePhoto(id) {
  assertId(id, 'photo');
  const row = await GalleryPhoto.findOne({ _id: id, ...NOT_DELETED });
  if (!row) throw notFound('Photo');
  // Folder photos are remembered as deleted so "Import folder" doesn't add them back
  if (row.source === 'folder') await GalleryPhoto.updateOne({ _id: id }, { $set: { deletedAt: new Date() }, $unset: { image: 1 } });
  else await row.deleteOne();
}

// ---------- news images ----------

// Every image used by a published post (cover + images in the text)
function postImages(post) {
  const images = [{ src: post.cover, kind: 'Cover' }];
  for (const block of post.body || []) if (block?.type === 'image' && block.src) images.push({ src: block.src, kind: 'In article', caption: block.caption || block.alt });
  return images.filter((i) => typeof i.src === 'string' && /^(\/|https?:\/\/)/.test(i.src));
}

export async function newsImages() {
  const [posts, added] = await Promise.all([
    Post.find({ status: 'published' }).select('title slug date category cover body').sort({ date: -1 }).limit(300).lean(),
    GalleryPhoto.find({ source: 'news', ...NOT_DELETED }).select('src').lean(),
  ]);
  const inGallery = new Set(added.map((p) => p.src));
  return posts.map((post) => ({
    _id: String(post._id),
    title: post.title,
    date: post.date,
    category: post.category,
    images: postImages(post).map((img) => ({ ...img, added: inGallery.has(img.src) })),
  }));
}

// Size of a local /public image (falls back to 4:3 for remote ones)
function dimensionsOf(src) {
  if (src.startsWith('/') && !src.startsWith('//')) {
    try {
      const file = path.join(process.cwd(), 'public', decodeURIComponent(src.split('?')[0]));
      if (file.startsWith(path.join(process.cwd(), 'public'))) {
        const size = imageSize(fs.readFileSync(file));
        if (size?.width) return size;
      }
    } catch {
      /* unreadable — use the default */
    }
  }
  return { width: 1200, height: 900 };
}

// Body: { items: [{ postId, src }], album? } — only images that really belong to the post are accepted
export async function addFromNews(input = {}, { userId } = {}) {
  const items = Array.isArray(input.items) ? input.items.slice(0, 100) : [];
  if (!items.length) throw new HttpError(400, 'Select at least one photo.');
  const album = str(input.album, 80);
  const ids = [...new Set(items.map((i) => str(i.postId)).filter((id) => /^[a-f\d]{24}$/i.test(id)))];
  const posts = new Map((await Post.find({ _id: { $in: ids } }).select('title cover body').lean()).map((p) => [String(p._id), p]));
  const existing = new Set((await GalleryPhoto.find({ source: 'news', ...NOT_DELETED }).select('src').lean()).map((p) => p.src));
  const docs = [];
  for (const { postId, src } of items) {
    const post = posts.get(String(postId));
    const image = post && postImages(post).find((i) => i.src === src);
    if (!image || existing.has(src)) continue;
    existing.add(src);
    docs.push({ source: 'news', src, post: post._id, ...dimensionsOf(src), caption: image.caption || post.title, album: album || post.title.slice(0, 80), createdBy: userId });
  }
  if (docs.length) await GalleryPhoto.insertMany(docs);
  return { added: docs.length, skipped: items.length - docs.length };
}

export async function countPhotos() {
  return GalleryPhoto.countDocuments({ ...NOT_DELETED, hidden: { $ne: true } });
}
