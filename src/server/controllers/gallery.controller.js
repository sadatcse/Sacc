import { NextResponse } from 'next/server';
import { HttpError, created, ok, readJson } from '@/server/http';
import * as gallery from '@/server/services/gallery.service';

async function formData(req) {
  try {
    return await req.formData();
  } catch {
    throw new HttpError(400, 'Send the photo as multipart form data.');
  }
}

// Public: visible photos. Admin ?all=1: everything (incl. hidden) + album names.
export async function list({ query, session }) {
  if (query.get('all') && session?.role === 'admin') {
    const [photos, albums] = await Promise.all([gallery.listPhotos(), gallery.albumNames()]);
    return ok({ photos, albums });
  }
  return ok(await gallery.getGalleryPhotos());
}

export async function upload({ req, session }) {
  return created(await gallery.uploadPhoto(await formData(req), { userId: session._id }), 'Photo added.');
}

export async function update({ req, params }) {
  return ok(await gallery.updatePhoto(params.id, await readJson(req)), 'Photo saved.');
}

export async function replace({ req, params }) {
  return ok(await gallery.replaceImage(params.id, await formData(req)), 'Picture changed.');
}

export async function remove({ params }) {
  await gallery.deletePhoto(params.id);
  return ok(undefined, 'Photo deleted.');
}

// Stored (uploaded) image bytes. The version is part of the URL, so the response can be cached forever.
export async function image({ params }) {
  const { data, contentType } = await gallery.getImage(params.id);
  return new NextResponse(data, {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function newsImages() {
  return ok(await gallery.newsImages());
}

export async function addFromNews({ req, session }) {
  const result = await gallery.addFromNews(await readJson(req), { userId: session._id });
  return created(result, `${result.added} photo${result.added === 1 ? '' : 's'} added from news.`);
}

export async function importFolder({ session }) {
  const result = await gallery.importFolder({ userId: session._id });
  const parts = [
    result.added && `${result.added} new`,
    result.restored && `${result.restored} brought back`,
    result.removed && `${result.removed} missing file${result.removed === 1 ? '' : 's'} cleaned up`,
  ].filter(Boolean);
  return ok(result, parts.length ? `public/gallery (${result.total} files): ${parts.join(', ')}.` : `All ${result.total} photos in public/gallery are already in the gallery.`);
}
