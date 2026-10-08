// Gallery photos come straight from the public/gallery folder — drop images in, they appear on /gallery.
//   public/gallery/photo.jpg                  → album "Moments"
//   public/gallery/Tech Fest 2026/photo.jpg   → album "Tech Fest 2026" (one level of sub-folders = albums)
// A readable file name ("Freshers' Reception 2026.jpg") becomes the caption; camera / Facebook
// style names (IMG_1234.jpg, 7419847_158225_n.jpg) get none. Newest files are shown first.
// Server-only (uses the file system).
import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';

const GALLERY_DIR = path.join(process.cwd(), 'public', 'gallery');
const IMAGE_FILE = /\.(jpe?g|png|webp|gif)$/i;
export const DEFAULT_ALBUM = 'Moments';

// EXIF orientation 5–8 means the photo is stored rotated 90°
function exifOrientation(buf, tiff) {
  const le = buf.toString('ascii', tiff, tiff + 2) === 'II';
  const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const ifd = tiff + u32(tiff + 4);
  for (let i = 0, count = u16(ifd); i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (u16(entry) === 0x0112) return u16(entry + 8);
  }
  return 1;
}

// Reads width/height from the file header (JPEG, PNG, WebP, GIF)
function imageSize(buf) {
  if (buf.readUInt32BE(0) === 0x89504e47) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf.toString('ascii', 0, 3) === 'GIF') return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (chunk === 'VP8L') {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    let orientation = 1;
    while (offset < buf.length - 9) {
      if (buf[offset] !== 0xff) { offset++; continue; }
      const marker = buf[offset + 1];
      if (marker === 0xff) { offset++; continue; }
      if (marker === 0xe1 && buf.toString('ascii', offset + 4, offset + 8) === 'Exif') orientation = exifOrientation(buf, offset + 10);
      // SOFn frame header (skip DHT/JPG/DAC markers that share the range)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return orientation >= 5 ? { width: height, height: width } : { width, height };
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
  }
  return null;
}

function captionFromName(file) {
  const base = file.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/[.\s]+$/, '').trim();
  const isMachineName = /^[\d\s-]+n?$/i.test(base) || /^(img|dsc|dscn|pxl|photo|image|screenshot|whatsapp image)[\s-]*\d/i.test(base);
  return isMachineName ? null : base;
}

function readPhoto(dir, file, album) {
  try {
    const full = path.join(dir, file);
    const size = imageSize(fs.readFileSync(full));
    if (!size?.width || !size?.height) return null;
    const urlPath = [album, file].filter(Boolean).map(encodeURIComponent).join('/');
    return {
      src: `/gallery/${urlPath}`,
      width: size.width,
      height: size.height,
      album: album || DEFAULT_ALBUM,
      caption: captionFromName(file),
      modified: fs.statSync(full).mtimeMs,
    };
  } catch {
    return null; // unreadable or corrupt image — skip it
  }
}

// All photos, newest first. Cached per request.
export const getGalleryPhotos = cache(() => {
  if (!fs.existsSync(GALLERY_DIR)) return [];
  const photos = [];
  for (const entry of fs.readdirSync(GALLERY_DIR, { withFileTypes: true })) {
    if (entry.isFile() && IMAGE_FILE.test(entry.name)) {
      photos.push(readPhoto(GALLERY_DIR, entry.name, null));
    } else if (entry.isDirectory()) {
      const dir = path.join(GALLERY_DIR, entry.name);
      for (const file of fs.readdirSync(dir)) {
        if (IMAGE_FILE.test(file)) photos.push(readPhoto(dir, file, entry.name));
      }
    }
  }
  return photos
    .filter(Boolean)
    .sort((a, b) => b.modified - a.modified || a.src.localeCompare(b.src))
    .map(({ modified, ...photo }, i) => ({ id: i, ...photo }));
});
