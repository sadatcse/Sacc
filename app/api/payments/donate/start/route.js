import { route } from '@/server/http';
import * as payments from '@/server/controllers/payment.controller';

// Public: step 1 of the Donate dialog → unfinished donation { token, reference }
export const POST = route(payments.startDonation);
