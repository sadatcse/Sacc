import { route } from '@/server/http';
import * as certificates from '@/server/controllers/certificate.controller';

export const dynamic = 'force-dynamic';

// Faculty advisor's signature for certificates (multipart: signature — PNG / JPG, ≤ 1 MB)
export const GET = route(certificates.signature, { roles: ['admin'] });
export const PUT = route(certificates.setSignature, { roles: ['admin'] });
export const DELETE = route(certificates.removeSignature, { roles: ['admin'] });
