import { route } from '@/server/http';
import * as executives from '@/server/controllers/executive.controller';

export const dynamic = 'force-dynamic';

export const GET = route(executives.listPositions);
export const POST = route(executives.createPosition, { roles: ['admin'] });
