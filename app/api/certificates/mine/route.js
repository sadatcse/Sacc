import { route } from '@/server/http';
import * as certificates from '@/server/controllers/certificate.controller';

export const dynamic = 'force-dynamic';

export const GET = route(certificates.mine, { auth: true });
