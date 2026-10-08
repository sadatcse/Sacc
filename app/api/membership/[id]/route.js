import { route } from '@/server/http';
import * as membership from '@/server/controllers/membership.controller';

export const PATCH = route(membership.review, { roles: ['admin'] });
export const DELETE = route(membership.remove, { roles: ['admin'] });
