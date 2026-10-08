import { route } from '@/server/http';
import * as auth from '@/server/controllers/auth.controller';

export const dynamic = 'force-dynamic';

export const GET = route(auth.me, { auth: true });
