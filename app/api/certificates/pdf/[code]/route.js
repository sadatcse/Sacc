import { route } from '@/server/http';
import * as certificates from '@/server/controllers/certificate.controller';

export const dynamic = 'force-dynamic';

// Admins, or the signed-in person the certificate belongs to (checked in the service)
export const GET = route(certificates.pdf, { auth: true });
