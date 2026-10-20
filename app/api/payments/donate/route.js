import { route } from '@/server/http';
import * as payments from '@/server/controllers/payment.controller';

// Public: Donate button on /alumni → pending donation (linked to the account when signed in)
export const POST = route(payments.donate);
