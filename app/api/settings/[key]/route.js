import { route } from '@/server/http';
import * as settings from '@/server/controllers/settings.controller';

export const dynamic = 'force-dynamic';

export const GET = route(settings.show);
export const PUT = route(settings.update, { roles: ['admin'] });
