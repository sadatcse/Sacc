import { readUpload } from '@/server/services/upload.service';

// Serves uploaded images from UPLOAD_DIR (see src/server/services/upload.service.js). File names are unique,
// so they can be cached forever.
export async function GET(_req, { params }) {
  const { path } = await params;
  const file = await readUpload(path);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(file.data, {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
