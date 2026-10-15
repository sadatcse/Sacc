import { route } from '@/server/http';
import * as events from '@/server/controllers/event-certificate.controller';

export const dynamic = 'force-dynamic';

export const GET = route(events.show, { roles: ['admin'] });
export const PATCH = route(events.update, { roles: ['admin'] });
export const DELETE = route(events.remove, { roles: ['admin'] });
