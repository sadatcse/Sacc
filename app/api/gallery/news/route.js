import { route } from '@/server/http';
import * as gallery from '@/server/controllers/gallery.controller';

export const dynamic = 'force-dynamic';

// Images from published news posts, to pick for the gallery
export const GET = route(gallery.newsImages, { roles: ['admin'] });
export const POST = route(gallery.addFromNews, { roles: ['admin'] });
