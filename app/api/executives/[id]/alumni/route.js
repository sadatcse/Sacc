import { route } from '@/server/http';
import * as requests from '@/server/controllers/alumni-request.controller';

export const POST = route(requests.convertExecutive, { roles: ['admin'] });
