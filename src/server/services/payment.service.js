// Payments received by the club: joining fees, membership renewals and alumni donations (Dashboard → Payments,
// Account → Payments). A verified renewal extends the member's application.expiresAt.
import Payment from '@/models/Payment';
import MembershipApplication from '@/models/MembershipApplication';
import User from '@/models/User';
import { MOBILE_PAYMENT_METHODS, PAYMENT_METHODS, PAYMENT_STATUSES, PAYMENT_TYPES, RENEW_YEARS } from '@/config/membership';
import { addYears, membershipPeriod } from '@/lib/membership';
import { getSetting } from '@/server/services/settings.service';
import { HttpError } from '@/server/http';
import { assertId, notFound, str, toPlain } from '@/server/validate';
import { escapeRegex } from '@/lib/utils';

const TYPES = PAYMENT_TYPES.map((t) => t.value);
const STATUSES = PAYMENT_STATUSES.map((s) => s.value);
const MAX_DONATION = 10_000_000;

const fullName = (app) => `${app.firstName} ${app.lastName}`.trim();
const payerFromApplication = (app) => ({
  application: app._id,
  user: app.user,
  name: fullName(app),
  email: app.personalEmail,
  phone: app.phone,
  studentId: app.studentId,
  batch: app.batch,
});

// Payment method + sender number + transaction ID, checked the same way as the Join form
function cleanTransfer(input) {
  const data = {
    method: str(input.method, 20),
    paidFrom: str(input.paidFrom, 30),
    transactionId: str(input.transactionId, 60),
    note: str(input.note, 1000),
  };
  if (!PAYMENT_METHODS.some((m) => m.value === data.method)) throw new HttpError(400, 'Choose a payment method.');
  if (MOBILE_PAYMENT_METHODS.includes(data.method)) {
    const missing = [!data.paidFrom && 'Number you paid from', !data.transactionId && 'Transaction ID'].filter(Boolean);
    if (missing.length) throw new HttpError(400, `Please fill in: ${missing.join(', ')}.`);
  }
  return data;
}

async function assertNewTransaction(transactionId, exceptId) {
  if (!transactionId) return;
  const dup = await Payment.exists({ transactionId: new RegExp(`^${escapeRegex(transactionId)}$`, 'i'), status: { $ne: 'rejected' }, ...(exceptId && { _id: { $ne: exceptId } }) });
  if (dup) throw new HttpError(409, 'This transaction ID has already been used for another payment.');
}

function parseYears(value) {
  const years = Number(value);
  if (!RENEW_YEARS.includes(years)) throw new HttpError(400, 'Renew for 1, 2 or 3 years.');
  return years;
}

// ---------- membership period ----------

// The joining fee of an approved application as a verified payment (runs once per application)
export async function ensureMembershipPayment(app) {
  if (!app || app.status !== 'approved') return;
  await Payment.updateOne(
    { application: app._id, type: 'membership' },
    {
      $setOnInsert: {
        ...payerFromApplication(app),
        type: 'membership',
        status: 'verified',
        amount: Number(app.amount) || 0,
        method: app.paymentMethod || '',
        paidFrom: app.paymentFrom || '',
        transactionId: app.transactionId || '',
        paidAt: app.createdAt || new Date(),
        periodStart: app.joinedAt || app.reviewedAt || app.createdAt,
        periodEnd: app.expiresAt,
        reviewedBy: app.reviewedBy?._id || app.reviewedBy,
        reviewedAt: app.reviewedAt,
      },
    },
    { upsert: true }
  ).catch((error) => {
    if (error?.code !== 11000) throw error; // another request created it at the same moment
  });
}

export async function removeMembershipPayment(applicationId) {
  await Payment.deleteOne({ application: applicationId, type: 'membership' });
}

// Applications approved before payments were recorded get their joining-fee record
async function backfillMembershipPayments() {
  const have = await Payment.distinct('application', { type: 'membership' });
  const missing = await MembershipApplication.find({ status: 'approved', _id: { $nin: have } }).limit(1000).lean();
  for (const app of missing) await ensureMembershipPayment(app);
}

// Verified renewal → membership runs `years` more from the current expiry (or from today if it has expired)
async function applyRenewal(payment) {
  const app = await MembershipApplication.findById(payment.application).lean();
  if (!app || app.status !== 'approved') throw new HttpError(400, 'This member’s club membership is not approved, so it can’t be renewed.');
  const period = membershipPeriod(app);
  const start = period.expired ? new Date() : period.expiresAt;
  const end = addYears(start, payment.years || 1);
  await MembershipApplication.updateOne({ _id: app._id }, { $set: { joinedAt: period.joinedAt, expiresAt: end } });
  payment.periodStart = start;
  payment.periodEnd = end;
}

// Undo a renewal (un-verified or deleted) if it is still the latest extension
async function revertRenewal(payment) {
  if (!payment.periodEnd) return;
  await MembershipApplication.updateOne({ _id: payment.application, expiresAt: payment.periodEnd }, { $set: { expiresAt: payment.periodStart } });
  payment.periodStart = undefined;
  payment.periodEnd = undefined;
}

// ---------- admin ----------

export async function listPayments({ type, status, search, application } = {}) {
  await backfillMembershipPayments();
  const filter = {};
  if (TYPES.includes(type)) filter.type = type;
  if (STATUSES.includes(status)) filter.status = status;
  if (application) {
    assertId(application, 'application');
    filter.application = application;
  }
  if (search) {
    const re = new RegExp(escapeRegex(str(search, 80)), 'i');
    filter.$or = [{ name: re }, { email: re }, { phone: re }, { studentId: re }, { transactionId: re }, { paidFrom: re }];
  }
  const [rows, totals] = await Promise.all([
    Payment.find(filter).sort({ paidAt: -1, createdAt: -1 }).limit(3000).populate('reviewedBy recordedBy', 'name').lean(),
    Payment.aggregate([{ $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
  ]);
  const sum = (match) => totals.filter((t) => match(t._id)).reduce((acc, t) => ({ count: acc.count + t.count, amount: acc.amount + t.amount }), { count: 0, amount: 0 });
  const stats = {
    received: sum((id) => id.status === 'verified'),
    pending: sum((id) => id.status === 'pending'),
    ...Object.fromEntries(TYPES.map((t) => [t, sum((id) => id.type === t && id.status === 'verified')])),
  };
  return { rows: toPlain(rows), stats };
}

// Admin records a payment (e.g. cash at the club desk). Renewals need the member's application; donations a name.
// Body: { type, application?, years?, name?, email?, phone?, amount, method, paidFrom?, transactionId?, note?, paidAt? }
export async function createPayment(input = {}, { userId } = {}) {
  const type = str(input.type, 20);
  if (!['renewal', 'donation'].includes(type)) throw new HttpError(400, 'Record a renewal or a donation (joining fees come from approved applications).');
  const transfer = cleanTransfer(input);
  await assertNewTransaction(transfer.transactionId);
  const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
  if (Number.isNaN(paidAt.getTime())) throw new HttpError(400, 'Invalid payment date.');
  const data = { type, ...transfer, paidAt, status: 'verified', recordedBy: userId, reviewedBy: userId, reviewedAt: new Date() };

  if (type === 'renewal') {
    assertId(input.application, 'member');
    const app = await MembershipApplication.findOne({ _id: input.application, status: 'approved' }).lean();
    if (!app) throw new HttpError(400, 'Choose an approved club member.');
    data.years = parseYears(input.years);
    const settings = await getSetting('membership');
    const amount = input.amount === '' || input.amount === undefined ? settings.renewFee * data.years : Number(input.amount);
    if (!Number.isFinite(amount) || amount < 0) throw new HttpError(400, 'Enter a valid amount.');
    Object.assign(data, payerFromApplication(app), { amount });
  } else {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_DONATION) throw new HttpError(400, 'Enter the amount received.');
    Object.assign(data, { amount, name: str(input.name, 120), email: str(input.email, 160).toLowerCase(), phone: str(input.phone, 30) });
    if (!data.name) throw new HttpError(400, 'Enter the donor’s name.');
    if (data.email) {
      const user = await User.findOne({ email: data.email }).select('_id').lean();
      if (user) data.user = user._id;
    }
  }

  const payment = new Payment(data);
  if (type === 'renewal') await applyRenewal(payment);
  await payment.save();
  return toPlain((await Payment.findById(payment._id).populate('reviewedBy recordedBy', 'name').lean()));
}

// Body: { status?, adminNote? }
export async function reviewPayment(id, input = {}, { userId } = {}) {
  assertId(id, 'payment');
  const payment = await Payment.findById(id);
  if (!payment) throw notFound('Payment');
  if ('adminNote' in input) payment.adminNote = str(input.adminNote, 1000);
  if ('status' in input && input.status !== payment.status) {
    if (!STATUSES.includes(input.status)) throw new HttpError(400, 'Invalid status.');
    if (payment.type === 'membership') throw new HttpError(400, 'The joining fee follows its application — approve or reject the application instead.');
    if (payment.type === 'renewal') {
      if (input.status === 'verified') await applyRenewal(payment);
      else if (payment.status === 'verified') await revertRenewal(payment);
    }
    if (input.status === 'verified') await assertNewTransaction(payment.transactionId, payment._id);
    payment.status = input.status;
    if (input.status === 'pending') {
      payment.reviewedBy = undefined;
      payment.reviewedAt = undefined;
    } else {
      payment.reviewedBy = userId;
      payment.reviewedAt = new Date();
    }
  }
  await payment.save();
  return toPlain(await Payment.findById(id).populate('reviewedBy recordedBy', 'name').lean());
}

export async function deletePayment(id) {
  assertId(id, 'payment');
  const payment = await Payment.findById(id);
  if (!payment) throw notFound('Payment');
  if (payment.type === 'membership') throw new HttpError(400, 'Joining fees are kept with their application.');
  if (payment.type === 'renewal' && payment.status === 'verified') await revertRenewal(payment);
  await payment.deleteOne();
}

export async function countPendingPayments() {
  return Payment.countDocuments({ status: 'pending' });
}

// ---------- the signed-in member / alumnus ----------

async function ownApplication(userId) {
  return MembershipApplication.findOne({ user: userId, status: 'approved' }).sort({ reviewedAt: -1 }).lean();
}

// Account → Payments: membership period (students), payment history and how to pay
export async function myPayments(session) {
  const app = session.role === 'student' ? await ownApplication(session._id) : null;
  if (app) await ensureMembershipPayment(app);
  const [rows, settings] = await Promise.all([
    Payment.find({ user: session._id }).sort({ paidAt: -1, createdAt: -1 }).limit(200).lean(),
    getSetting('membership'),
  ]);
  const period = app && membershipPeriod(app);
  return toPlain({
    role: session.role,
    membership: app
      ? { name: fullName(app), studentId: app.studentId, batch: app.batch, joinedAt: period.joinedAt, expiresAt: period.expiresAt, expired: period.expired, daysLeft: period.daysLeft }
      : null,
    payments: rows.map(({ adminNote: _note, ...p }) => p),
    pendingRenewal: rows.some((p) => p.type === 'renewal' && p.status === 'pending'),
    pay: { renewFee: settings.renewFee, bkash: settings.bkash, nagad: settings.nagad, rocket: settings.rocket, reference: settings.reference },
  });
}

// Body: { type: 'renewal', years, method, paidFrom, transactionId, note } (approved student members)
//    or { type: 'donation', amount, method, paidFrom, transactionId, note } (alumni)
export async function submitOwnPayment(session, input = {}) {
  const type = str(input.type, 20);
  const transfer = cleanTransfer(input);
  await assertNewTransaction(transfer.transactionId);
  const user = await User.findById(session._id).select('name email phone').lean();
  const data = { type, status: 'pending', user: session._id, ...transfer, name: user?.name || '', email: user?.email || '', phone: user?.phone || '' };

  if (type === 'renewal') {
    if (session.role !== 'student') throw new HttpError(403, 'Only club members can renew a membership.');
    const app = await ownApplication(session._id);
    if (!app) throw new HttpError(403, 'Renewal opens once your club membership is approved.');
    if (await Payment.exists({ application: app._id, type: 'renewal', status: 'pending' })) {
      throw new HttpError(409, 'Your last renewal is still waiting for a committee check.');
    }
    const settings = await getSetting('membership');
    data.years = parseYears(input.years);
    Object.assign(data, payerFromApplication(app), { amount: settings.renewFee * data.years, user: session._id });
  } else if (type === 'donation') {
    if (session.role !== 'alumni') throw new HttpError(403, 'Donations from this page are for alumni.');
    const amount = Math.round(Number(input.amount));
    if (!Number.isFinite(amount) || amount < 10 || amount > MAX_DONATION) throw new HttpError(400, 'Enter an amount of at least 10 BDT.');
    data.amount = amount;
  } else {
    throw new HttpError(400, 'Unknown payment type.');
  }
  const payment = await Payment.create(data);
  const { adminNote: _note, ...plain } = payment.toObject();
  return toPlain(plain);
}
