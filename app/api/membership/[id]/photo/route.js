import { route } from '@/server/http';
import * as membership from '@/server/controllers/membership.controller';

export const dynamic = 'force-dynamic';

export const GET = route(membership.photo, { roles: ['admin'] });
