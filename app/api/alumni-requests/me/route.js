import { route } from '@/server/http';
import * as requests from '@/server/controllers/alumni-request.controller';

export const dynamic = 'force-dynamic';

export const GET = route(requests.mine, { auth: true });
