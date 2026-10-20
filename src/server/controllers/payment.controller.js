import { HttpError, created, ok, readJson } from '@/server/http';
import { isRateLimited } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/visitor';
import * as payments from '@/server/services/payment.service';

// Admin: every payment + totals. Filters: type, status, search, application
export async function list({ query }) {
  return ok(await payments.listPayments({
    type: query.get('type'),
    status: query.get('status'),
    search: query.get('search'),
    application: query.get('application'),
  }));
}

export async function create({ req, session }) {
  return created(await payments.createPayment(await readJson(req), { userId: session._id }), 'Payment recorded.');
}

export async function review({ req, params, session }) {
  return ok(await payments.reviewPayment(params.id, await readJson(req), { userId: session._id }), 'Payment updated.');
}

export async function remove({ params }) {
  await payments.deletePayment(params.id);
  return ok(undefined, 'Payment deleted.');
}

// Signed-in member / alumnus: own membership period + payments
export async function mine({ session }) {
  return ok(await payments.myPayments(session));
}

export async function submitOwn({ req, session }) {
  const payment = await payments.submitOwnPayment(session, await readJson(req));
  return created(
    payment,
    payment.type === 'renewal'
      ? 'Renewal sent! Your membership is extended as soon as the committee checks the payment.'
      : 'Thank you for your donation! The committee will confirm it soon.'
  );
}

// Public: Donate button on /alumni → pending donation (rate-limited per IP)
export async function donate({ req, session }) {
  if (isRateLimited(`donate:${getClientIp(req)}`, { limit: 10, windowMs: 60 * 60 * 1000 })) {
    throw new HttpError(429, 'Too many donations from this connection — please try again later.');
  }
  const payment = await payments.submitDonation(await readJson(req), { session });
  return created(payment, 'Thank you for supporting the club! The committee will confirm your donation after checking the payment.');
}

// Public: "Continue to payment" → saves the unfinished donation (reminder emails go out if it's never paid)
export async function startDonation({ req, session }) {
  if (isRateLimited(`donate-start:${getClientIp(req)}`, { limit: 20, windowMs: 60 * 60 * 1000 })) {
    throw new HttpError(429, 'Too many attempts from this connection — please try again later.');
  }
  return created(await payments.startDonation(await readJson(req), { session }));
}

// Admin: "Send reminder now" on an unfinished donation
export async function remind({ params }) {
  return ok(await payments.remindDonationNow(params.id), 'Reminder sent.');
}

// Scheduler (e.g. Vercel Cron / any cron service): GET /api/cron/donation-reminders with
// "Authorization: Bearer <CRON_SECRET>". A long-running server also does this by itself (instrumentation.js).
export async function cronReminders({ req }) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) throw new HttpError(401, 'Not allowed.');
  return ok(await payments.sendDonationReminders());
}
