import { route } from '@/server/http';
import * as payments from '@/server/controllers/payment.controller';

export const dynamic = 'force-dynamic';

// Cron: sends due reminders for unfinished donations (needs CRON_SECRET)
export const GET = route(payments.cronReminders);
