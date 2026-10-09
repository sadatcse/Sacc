import { route } from '@/server/http';
import * as logs from '@/server/controllers/logs.controller';

export const dynamic = 'force-dynamic';

export const GET = route(logs.logins, { roles: ['admin'] });
