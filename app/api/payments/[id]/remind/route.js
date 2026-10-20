import { route } from '@/server/http';
import * as payments from '@/server/controllers/payment.controller';

// Admin: email the donor of an unfinished donation now
export const POST = route(payments.remind, { roles: ['admin'] });
