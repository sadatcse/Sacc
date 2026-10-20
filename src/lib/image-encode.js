// Server-only: turns an uploaded photo into a web-ready image (gallery + every photo field).
// Uses sharp when it is available → upright WebP, at most `maxEdge` px, metadata stripped.
// sharp is loaded lazily: on old Linux servers (e.g. cPanel on CentOS 7, glibc < 2.27) its native build can't load —
// `npm run build` installs the WebAssembly build there (scripts/build.js). If sharp still can't load, the original
// file is kept as-is (only real JPEG / PNG / WebP / GIF images are accepted), so uploads never break the site.
import { imageSize } from '@/lib/gallery';

let sharpModule;
async function loadSharp() {
  if (sharpModule === undefined) {
    try {
      sharpModule = (await import('sharp')).default;
    } catch (error) {
      console.warn('Image processing (sharp) is not available — photos are stored without resizing.', error.message);
      sharpModule = null;
    }
  }
  return sharpModule;
}

// Real image type from the first bytes (ignores the browser-sent type)
export function sniffImage(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { contentType: 'image/jpeg', ext: '.jpg' };
  if (buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47) return { contentType: 'image/png', ext: '.png' };
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { contentType: 'image/webp', ext: '.webp' };
  if (buf.length > 6 && buf.toString('ascii', 0, 3) === 'GIF') return { contentType: 'image/gif', ext: '.gif' };
  return null;
}

// Buffer → { data, contentType, ext, width, height } or null when it isn't a readable image
export async function encodeImage(input, { maxEdge = 2000, quality = 82 } = {}) {
  const sharp = await loadSharp();
  if (sharp) {
    try {
      const { data, info } = await sharp(input, { failOn: 'error' })
        .rotate() // apply EXIF orientation, then drop the metadata (location etc.)
        .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toBuffer({ resolveWithObject: true });
      return { data, contentType: 'image/webp', ext: '.webp', width: info.width, height: info.height };
    } catch {
      return null;
    }
  }
  // No sharp: keep the original, but only if it really is an image we can measure
  const type = sniffImage(input);
  let size = null;
  try {
    size = type && imageSize(input);
  } catch {
    /* truncated file */
  }
  if (!type || !size?.width || !size?.height) return null;
  return { data: input, ...type, width: size.width, height: size.height };
}
