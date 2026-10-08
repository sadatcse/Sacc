import { route } from '@/server/http';
import * as news from '@/server/controllers/news.controller';

export const dynamic = 'force-dynamic';

export const GET = route(news.list);
export const POST = route(news.create, { roles: ['admin'] });
