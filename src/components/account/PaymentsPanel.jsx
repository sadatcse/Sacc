'use client';
import { useCallback, useEffect, useState } from 'react';
import { FaCalendarCheck, FaExclamationTriangle, FaHandHoldingHeart, FaRedo } from 'react-icons/fa';
import { apiSecure, apiError } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import { PAYMENT_STATUSES, PAYMENT_TYPES, RENEW_YEARS } from '@/config/membership';
import { kindOf, methodLabel } from '@/config/payment-methods';
import PayTo from '@/components/payments/PayTo';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Skeleton from '@/components/ui/Skeleton';
import { Input, Select, Textarea } from '@/components/forms/FormField';

const TYPE = Object.fromEntries(PAYMENT_TYPES.map((t) => [t.value, t]));
const STATUS = Object.fromEntries(PAYMENT_STATUSES.map((s) => [s.value, s]));
const bdt = (n) => `${Number(n || 0).toLocaleString('en-US')} BDT`;
const EMPTY = { years: '1', amount: '', method: '', paidFrom: '', transactionId: '', note: '' };

function PaymentForm({ type, pay, disabled, onSent }) {
  const [values, setValues] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));
  const renewal = type === 'renewal';
  // Methods switched on for this purpose in Dashboard → Payment Methods
  const methods = pay.methods.filter((m) => m.purposes.includes(type));
  const method = methods.find((m) => m.key === values.method) || methods[0];
  const kind = kindOf(method);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiSecure.post('/payments/mine', { ...values, method: method.key, type, years: Number(values.years), amount: Number(values.amount) });
      setValues(EMPTY);
      setStatus({ type: 'success', message: res.data.message });
      onSent();
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err) });
    } finally {
      setBusy(false);
    }
  };

  const locked = disabled || busy;
  if (!methods.length) return <Alert type="info">The club hasn’t published a payment method for this yet. Please contact the committee.</Alert>;
  const amount = renewal ? bdt(pay.renewFee * Number(values.years)) : values.amount && bdt(values.amount);
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {renewal ? (
          <Select
            label="Renew for"
            name="years"
            value={values.years}
            onChange={set('years')}
            disabled={locked}
            options={RENEW_YEARS.map((y) => ({ value: String(y), label: `${y} year${y > 1 ? 's' : ''} — ${bdt(pay.renewFee * y)}` }))}
          />
        ) : (
          <Input label="Amount (BDT)" name="amount" type="number" min="10" step="1" required value={values.amount} onChange={set('amount')} disabled={locked} placeholder="e.g. 1000" />
        )}
        <Select label="Paid with" name="method" value={method.key} onChange={set('method')} disabled={locked} options={methods.map((m) => ({ value: m.key, label: m.label }))} />
      </div>
      <PayTo method={method} amount={amount} reference={pay.reference} />
      <div className="grid gap-4 sm:grid-cols-2">
        {kind.from && (
          <Input label={kind.from.required ? kind.from.label : `${kind.from.label} (optional)`} name="paidFrom" required={kind.from.required} value={values.paidFrom} onChange={set('paidFrom')} disabled={locked} placeholder={kind.from.placeholder} />
        )}
        {kind.ref && (
          <Input label={kind.ref.required ? kind.ref.label : `${kind.ref.label} (optional)`} name="transactionId" required={kind.ref.required} value={values.transactionId} onChange={set('transactionId')} disabled={locked} placeholder={kind.ref.placeholder} />
        )}
      </div>
      <Textarea label={renewal ? 'Note (optional)' : 'Message to the club (optional)'} name="note" rows={2} value={values.note} onChange={set('note')} disabled={locked} />
      <Alert type={status.type || 'info'}>{status.message}</Alert>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {renewal ? <>Total: <span className="font-semibold text-ink">{bdt(pay.renewFee * Number(values.years))}</span></> : 'Any amount is welcome.'}
        </p>
        <Button type="submit" disabled={locked}>{busy ? 'Sending…' : renewal ? 'Send renewal' : 'Send donation'}</Button>
      </div>
    </form>
  );
}

function MembershipCard({ membership, pendingRenewal }) {
  const { expired, daysLeft } = membership;
  const soon = !expired && daysLeft <= 30;
  return (
    <div className={cn('rounded-xl border p-5', expired ? 'border-red-500/40 bg-red-500/5' : soon ? 'border-amber-500/40 bg-amber-500/5' : 'border-green-500/30 bg-green-500/5')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-subtle">Club membership</p>
          <p className={cn('mt-1 flex items-center gap-2 text-xl font-bold', expired ? 'text-red-700 dark:text-red-300' : 'text-ink')}>
            {expired ? <FaExclamationTriangle aria-hidden /> : <FaCalendarCheck className="text-green-600" aria-hidden />}
            {expired ? 'Membership expired' : 'Active member'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {membership.name} · ID {membership.studentId} · {membership.batch}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <dt className="text-subtle">Joined</dt>
          <dd className="font-medium text-ink">{formatDate(membership.joinedAt)}</dd>
          <dt className="text-subtle">{expired ? 'Expired on' : 'Valid until'}</dt>
          <dd className="font-medium text-ink">{formatDate(membership.expiresAt)}</dd>
        </dl>
      </div>
      {(expired || soon) && !pendingRenewal && (
        <p className="mt-3 text-sm text-body">{expired ? 'Renew below to become an active member again.' : `Your membership ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — renew below to keep it going.`}</p>
      )}
      {pendingRenewal && <p className="mt-3 text-sm text-body">Your renewal is waiting for a committee check — the new date appears here once it’s confirmed.</p>}
    </div>
  );
}

// Account → Payments: membership period + renewal (students), donations (alumni), and the payment history
export default function PaymentsPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      apiSecure
        .get('/payments/mine')
        .then((res) => setData(res.data.data))
        .catch((err) => setError(apiError(err, 'Could not load your payments.'))),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return <div className="space-y-4"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;

  const totalPaid = data.payments.filter((p) => p.status === 'verified').reduce((n, p) => n + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {data.role === 'student' &&
        (data.membership ? (
          <>
            <MembershipCard membership={data.membership} pendingRenewal={data.pendingRenewal} />
            <Card title={<span className="flex items-center gap-2"><FaRedo className="text-orange-500" aria-hidden /> Renew membership</span>}>
              <p className="mb-4 text-sm text-muted">
                Renew for 1 to 3 years ({bdt(data.pay.renewFee)} per year). The new years are added after your current end date — or from today if it has expired.
              </p>
              <PaymentForm type="renewal" pay={data.pay} disabled={data.pendingRenewal} onSent={load} />
            </Card>
          </>
        ) : (
          <Alert type="info">Renewals open once your club membership is approved.</Alert>
        ))}

      {data.role === 'alumni' && (
        <Card title={<span className="flex items-center gap-2"><FaHandHoldingHeart className="text-orange-500" aria-hidden /> Support the club</span>}>
          <p className="mb-4 text-sm text-muted">Your donation helps current students with contests, workshops and events. Every amount is recorded and confirmed by the committee.</p>
          <PaymentForm type="donation" pay={data.pay} onSent={load} />
        </Card>
      )}

      <Card className="p-0">
        <h3 className="border-b border-line/10 px-5 py-4 text-base">Payment history</h3>
        {data.payments.length ? (
          <>
            <ul className="divide-y divide-line/10">
              {data.payments.map((p) => (
                <li key={p._id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">
                      {TYPE[p.type]?.label}
                      {p.years > 0 && ` · ${p.years} year${p.years > 1 ? 's' : ''}`}
                    </p>
                    <p className="text-xs text-subtle">
                      {formatDate(p.paidAt)} · {methodLabel(data.pay.methods, p.method)}
                      {p.transactionId && ` · TrxID ${p.transactionId}`}
                      {p.periodEnd && ` · valid ${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`}
                    </p>
                  </div>
                  <span className="font-semibold text-ink">{bdt(p.amount)}</span>
                  <Badge color={STATUS[p.status]?.color}>{STATUS[p.status]?.label}</Badge>
                </li>
              ))}
            </ul>
            <p className="border-t border-line/10 px-5 py-3 text-right text-sm text-muted">
              Total paid: <span className="font-semibold text-ink">{bdt(totalPaid)}</span>
            </p>
          </>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-subtle">No payments yet.</p>
        )}
      </Card>
    </div>
  );
}
