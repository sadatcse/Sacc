import { route } from '@/server/http';
import * as gallery from '@/server/controllers/gallery.controller';

// Public image bytes for uploaded photos: /api/gallery/image/<id>/<version>
export const GET = route(gallery.image);
