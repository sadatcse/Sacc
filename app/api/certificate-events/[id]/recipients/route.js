import { route } from '@/server/http';
import * as events from '@/server/controllers/event-certificate.controller';

export const POST = route(events.addRecipients, { roles: ['admin'] });
