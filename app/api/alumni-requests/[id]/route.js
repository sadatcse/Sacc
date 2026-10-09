import { route } from '@/server/http';
import * as requests from '@/server/controllers/alumni-request.controller';

export const PATCH = route(requests.review, { roles: ['admin'] });
