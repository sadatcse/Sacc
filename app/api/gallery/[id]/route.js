import { route } from '@/server/http';
import * as gallery from '@/server/controllers/gallery.controller';

export const PATCH = route(gallery.update, { roles: ['admin'] });
export const DELETE = route(gallery.remove, { roles: ['admin'] });
