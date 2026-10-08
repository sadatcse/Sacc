import { route } from '@/server/http';
import * as membership from '@/server/controllers/membership.controller';

export const dynamic = 'force-dynamic';

export const GET = route(membership.list, { roles: ['admin'] });
export const POST = route(membership.submit);
