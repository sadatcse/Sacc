import { route } from '@/server/http';
import * as executives from '@/server/controllers/executive.controller';

export const PATCH = route(executives.updatePosition, { roles: ['admin'] });
export const DELETE = route(executives.removePosition, { roles: ['admin'] });
