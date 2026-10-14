import { route } from '@/server/http';
import * as certificates from '@/server/controllers/certificate.controller';

export const dynamic = 'force-dynamic';

// Public: anyone with the code can view / download the certificate (it is printed on it)
export const GET = route(certificates.pdf);
