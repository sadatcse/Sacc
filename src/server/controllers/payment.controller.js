import { created, ok, readJson } from '@/server/http';
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
