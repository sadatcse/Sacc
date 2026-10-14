import { route } from '@/server/http';
import * as certificates from '@/server/controllers/certificate.controller';

export const PATCH = route(certificates.update, { roles: ['admin'] });
export const DELETE = route(certificates.remove, { roles: ['admin'] });
