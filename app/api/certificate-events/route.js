import { route } from '@/server/http';
import * as events from '@/server/controllers/event-certificate.controller';

export const dynamic = 'force-dynamic';

export const GET = route(events.list, { roles: ['admin'] });
export const POST = route(events.create, { roles: ['admin'] });
