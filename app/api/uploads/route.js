import { route } from '@/server/http';
import * as uploads from '@/server/controllers/upload.controller';

// Signed in: upload an image (photo fields across the site) → { url }
export const POST = route(uploads.upload, { auth: true });
