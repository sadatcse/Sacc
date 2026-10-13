import { route } from '@/server/http';
import * as payments from '@/server/controllers/payment.controller';

export const PATCH = route(payments.review, { roles: ['admin'] });
export const DELETE = route(payments.remove, { roles: ['admin'] });
