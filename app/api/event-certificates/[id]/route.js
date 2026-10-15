import { route } from '@/server/http';
import * as events from '@/server/controllers/event-certificate.controller';

export const PATCH = route(events.updateCertificate, { roles: ['admin'] });
export const DELETE = route(events.removeCertificate, { roles: ['admin'] });
