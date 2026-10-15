import { route } from '@/server/http';
import * as gallery from '@/server/controllers/gallery.controller';

// Admin: { ids: [...] } → serial numbers 1…n in that order
export const POST = route(gallery.order, { roles: ['admin'] });
