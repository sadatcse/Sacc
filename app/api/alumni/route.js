import { route } from '@/server/http';
import * as alumni from '@/server/controllers/alumni.controller';

export const dynamic = 'force-dynamic';

export const GET = route(alumni.list);
export const POST = route(alumni.create, { roles: ['admin'] });
