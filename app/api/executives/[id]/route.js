import { route } from '@/server/http';
import * as executives from '@/server/controllers/executive.controller';

export const dynamic = 'force-dynamic';

export const GET = route(executives.showPerson);
export const PATCH = route(executives.updatePerson, { roles: ['admin'] });
export const DELETE = route(executives.removePerson, { roles: ['admin'] });
