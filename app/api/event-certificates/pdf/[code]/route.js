import { route } from '@/server/http';
import * as events from '@/server/controllers/event-certificate.controller';

export const dynamic = 'force-dynamic';

// Public when the event allows downloads from the verify page; otherwise admins only (checked in the service)
export const GET = route(events.pdf);
