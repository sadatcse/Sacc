import { route } from '@/server/http';
import * as profile from '@/server/controllers/profile.controller';

export const dynamic = 'force-dynamic';

export const GET = route(profile.show, { auth: true });
export const PUT = route(profile.update, { auth: true });
