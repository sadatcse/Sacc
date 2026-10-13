import { route } from '@/server/http';
import * as payments from '@/server/controllers/payment.controller';

export const dynamic = 'force-dynamic';

export const GET = route(payments.mine, { auth: true });
export const POST = route(payments.submitOwn, { auth: true });
