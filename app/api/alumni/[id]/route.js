import { route } from '@/server/http';
import * as alumni from '@/server/controllers/alumni.controller';

export const PATCH = route(alumni.update, { roles: ['admin'] });
export const DELETE = route(alumni.remove, { roles: ['admin'] });
