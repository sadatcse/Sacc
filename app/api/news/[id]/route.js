import { route } from '@/server/http';
import * as news from '@/server/controllers/news.controller';

export const dynamic = 'force-dynamic';

export const GET = route(news.show);
export const PATCH = route(news.update, { roles: ['admin'] });
export const DELETE = route(news.remove, { roles: ['admin'] });
