import { route } from '@/server/http';
import * as stats from '@/server/controllers/stats.controller';

export const dynamic = 'force-dynamic';

export const GET = route(stats.overview, { roles: ['admin'] });
