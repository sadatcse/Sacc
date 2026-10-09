import { route } from '@/server/http';
import * as requests from '@/server/controllers/alumni-request.controller';

export const dynamic = 'force-dynamic';

export const GET = route(requests.list, { roles: ['admin'] });
export const POST = route(requests.submit, { auth: true });
