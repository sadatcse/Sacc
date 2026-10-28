// Photo gallery (Dashboard → Gallery → /gallery and the home page preview).
// Photos are uploads (stored in MongoDB), files from public/gallery, or images picked from news posts.
import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { cachedPublic } from '@/lib/public-cache';
import connectDB from '@/lib/db';
import GalleryPhoto from '@/models/GalleryPhoto';
import Post from '@/models/Post';
import { DEFAULT_ALBUM, imageSize, scanGalleryFolder } from '@/lib/gallery';
import { encodeImage } from '@/lib/image-encode';
import { HttpError } from '@/server/http';
import { assertId, notFound, str, toPlain } from '@/server/validate';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // before re-encoding
const MAX_EDGE = 2000; // longest side after re-encoding
const NOT_DELETED = { deletedAt: { $exists: false } };

// Public URL of a photo. Uploads carry their version in the path, so a replaced picture gets a new URL.
const srcOf = (p) => (p.source === 'upload' || p.image?.contentType ? `/api/gallery/image/${p._id}/${p.version || 1}` : p.src);

// Display order everywhere: pinned first, then by serial number (1, 2, 3…), then photos without a serial, newest first
const ordered = (rows) =>
  [...rows].sort(
    (a, b) =>
      Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
      (a.serial ?? Infinity) - (b.serial ?? Infinity) ||
      new Date(b.createdAt) - new Date(a.createdAt)
  );

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

// Visible photos in display order (pinned, serial, newest). Cached per request and briefly between requests.
export const getGalleryPhotos = cache(() =>
  cachedPublic('gallery', async () => {
    await connectDB();
    await ensureImported();
    const rows = await GalleryPhoto.find({ ...NOT_DELETED, hidden: { $ne: true } }).lean();
    return ordered(rows).map(toPublic);
  })
);

export async function getImage(id) {
  assertId(id, 'photo');
  const row = await GalleryPhoto.findOne({ _id: id, ...NOT_DELETED }).select('+image.data image.contentType').lean();
  if (!row?.image?.data) throw notFound('Photo');
  return { data: Buffer.from(row.image.data.buffer ?? row.image.data), contentType: row.image.contentType };
}

// ---------- admin ----------

export async function listPhotos() {
  await ensureImported();
  const rows = await GalleryPhoto.find(NOT_DELETED).populate('post', 'title slug').lean();
  return ordered(rows).map(toAdmin);
}

// ---------- serial numbers (display order) ----------

// Numbers the photos 1…n in the given order; any photo not listed keeps its place after them
async function renumber(ids) {
  const rest = ordered(await GalleryPhoto.find({ ...NOT_DELETED, _id: { $nin: ids } }).select('featured serial createdAt').lean()).map((p) => String(p._id));
  const all = [...ids.map(String), ...rest];
  await GalleryPhoto.bulkWrite(all.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { serial: i + 1 } } } })));
}

// Dashboard → Gallery → Arrange: { ids: [photo ids in the new order] } (all photos, or the first ones)
export async function setOrder(input = {}) {
  const ids = [...new Set((Array.isArray(input.ids) ? input.ids : []).map(String))];
  if (!ids.length) throw new HttpError(400, 'Send the photos in their new order.');
  ids.forEach((id) => assertId(id, 'photo'));
  if ((await GalleryPhoto.countDocuments({ ...NOT_DELETED, _id: { $in: ids } })) !== ids.length) throw new HttpError(400, 'Some photos no longer exist — reload the page and try again.');
  await renumber(ids);
  return listPhotos();
}

// Moves one photo to serial `position` (1 = first) and renumbers the rest
async function moveTo(id, position) {
  const current = ordered(await GalleryPhoto.find(NOT_DELETED).select('featured serial createdAt').lean()).map((p) => String(p._id));
  const from = current.indexOf(String(id));
  if (from < 0) throw notFound('Photo');
  current.splice(from, 1);
  current.splice(Math.min(Math.max(position, 1), current.length + 1) - 1, 0, String(id));
  await renumber(current);
}

export async function albumNames() {
  return (await GalleryPhoto.distinct('album', NOT_DELETED)).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

// Any image (JPEG / PNG / WebP / GIF / HEIC…) → upright WebP, at most 2000 px, metadata stripped
async function encode(file) {
  if (!file || typeof file === 'string' || !file.size) throw new HttpError(400, 'Choose a photo to upload.');
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(400, 'The photo must be 10 MB or smaller.');
  const encoded = await encodeImage(Buffer.from(await file.arrayBuffer()), { maxEdge: MAX_EDGE });
  if (!encoded) throw new HttpError(400, 'That file is not an image we can read. Use JPG, PNG or WebP.');
  const { data, contentType, width, height } = encoded;
  return { image: { data, contentType, size: data.length }, width, height };
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
  if (input.serial !== undefined && input.serial !== '' && input.serial !== null) {
    const position = Number(input.serial);
    if (!Number.isInteger(position) || position < 1) throw new HttpError(400, 'Serial number must be 1 or more.');
    await moveTo(id, position);
  }
  const meta = cleanMeta(input);
  const row = await (Object.keys(meta).length
    ? GalleryPhoto.findOneAndUpdate({ _id: id, ...NOT_DELETED }, { $set: meta }, { returnDocument: 'after' })
    : GalleryPhoto.findOne({ _id: id, ...NOT_DELETED })
  )
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
