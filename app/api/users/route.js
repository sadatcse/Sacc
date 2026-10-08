import { route } from '@/server/http';
import * as users from '@/server/controllers/user.controller';

export const dynamic = 'force-dynamic';

export const GET = route(users.list, { roles: ['admin'] });
export const POST = route(users.create, { roles: ['admin'] });
