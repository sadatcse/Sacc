import { route } from '@/server/http';
import * as gallery from '@/server/controllers/gallery.controller';

export const dynamic = 'force-dynamic';

export const GET = route(gallery.list);
export const POST = route(gallery.upload, { roles: ['admin'] });
