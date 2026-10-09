import { route } from '@/server/http';
import * as gallery from '@/server/controllers/gallery.controller';

// Change the picture (multipart: photo)
export const PUT = route(gallery.replace, { roles: ['admin'] });
