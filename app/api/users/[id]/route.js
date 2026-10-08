import { route } from '@/server/http';
import * as users from '@/server/controllers/user.controller';

export const dynamic = 'force-dynamic';

export const GET = route(users.show, { roles: ['admin'] });
export const PATCH = route(users.update, { roles: ['admin'] });
export const DELETE = route(users.remove, { roles: ['admin'] });
