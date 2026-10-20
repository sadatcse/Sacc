import { HttpError, created } from '@/server/http';
import { isRateLimited } from '@/lib/rate-limit';
import { saveImage } from '@/server/services/upload.service';

// Signed in: multipart { file, folder? } → { url, width, height, size }. Admins upload to any folder,
// members only their profile photo. 60 uploads per hour per account.
export async function upload({ req, session }) {
  if (isRateLimited(`upload:${session._id}`, { limit: 60, windowMs: 60 * 60 * 1000 })) {
    throw new HttpError(429, 'Too many uploads — please wait a little and try again.');
  }
  let form;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, 'Send the image as multipart form data.');
  }
  return created(await saveImage(form, { session }), 'Image uploaded.');
}
