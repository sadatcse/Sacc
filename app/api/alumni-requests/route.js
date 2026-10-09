import { route } from '@/server/http';
import * as requests from '@/server/controllers/alumni-request.controller';

export const dynamic = 'force-dynamic';

// Admin: requests sent before the student "Become Alumni" option was removed
export const GET = route(requests.list, { roles: ['admin'] });
