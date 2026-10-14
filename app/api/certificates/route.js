import { route } from '@/server/http';
import * as certificates from '@/server/controllers/certificate.controller';

export const dynamic = 'force-dynamic';

export const GET = route(certificates.board, { roles: ['admin'] });
export const POST = route(certificates.issue, { roles: ['admin'] });
