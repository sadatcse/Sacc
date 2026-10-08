import { route } from '@/server/http';
import * as executives from '@/server/controllers/executive.controller';

export const dynamic = 'force-dynamic';

export const GET = route(executives.listPeople);
export const POST = route(executives.createPerson, { roles: ['admin'] });
