import { route } from '@/server/http';
import * as members from '@/server/controllers/members.controller';

export const dynamic = 'force-dynamic';

export const GET = route(members.list, { auth: true });
