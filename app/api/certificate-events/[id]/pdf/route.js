import { route } from '@/server/http';
import * as events from '@/server/controllers/event-certificate.controller';

export const dynamic = 'force-dynamic';

// All certificates of the event in one PDF (?type=participant · ?download=1)
export const GET = route(events.bundle, { roles: ['admin'] });
