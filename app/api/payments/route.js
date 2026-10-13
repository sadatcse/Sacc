import { route } from '@/server/http';
import * as payments from '@/server/controllers/payment.controller';

export const dynamic = 'force-dynamic';

export const GET = route(payments.list, { roles: ['admin'] });
export const POST = route(payments.create, { roles: ['admin'] });
