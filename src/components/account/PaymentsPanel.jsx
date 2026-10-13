'use client';
import { useCallback, useEffect, useState } from 'react';
import { FaCalendarCheck, FaExclamationTriangle, FaHandHoldingHeart, FaRedo, FaCopy, FaCheck } from 'react-icons/fa';
import { apiSecure, apiError } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import { MOBILE_PAYMENT_METHODS, PAYMENT_METHODS, PAYMENT_STATUSES, PAYMENT_TYPES, RENEW_YEARS } from '@/config/membership';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Skeleton from '@/components/ui/Skeleton';
import { Input, Select, Textarea } from '@/components/forms/FormField';

const TYPE = Object.fromEntries(PAYMENT_TYPES.map((t) => [t.value, t]));
const STATUS = Object.fromEntries(PAYMENT_STATUSES.map((s) => [s.value, s]));
const METHOD = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));
const bdt = (n) => `${Number(n || 0).toLocaleString('en-US')} BDT`;
const EMPTY = { years: '1', amount: '', method: 'bkash', paidFrom: '', transactionId: '', note: '' };

function CopyNumber({ number }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-md border border-line/15 px-2 py-1 font-mono text-sm text-ink hover:border-orange-500">
      {number} {copied ? <FaCheck className="text-green-600" aria-label="Copied" /> : <FaCopy className="text-xs text-subtle" aria-label="Copy" />}
    </button>
  );
}

// Where to send money (bKash / Nagad / Rocket numbers from Settings)
function HowToPay({ pay }) {
  const numbers = PAYMENT_METHODS.filter((m) => pay[m.value]);
  if (!numbers.length) return <p className="text-sm text-muted">Pay at the club desk, then send the details below.</p>;
  return (
    <div className="rounded-lg border border-orange-500/25 bg-orange-500/5 p-3 text-sm">
      <p className="mb-2 font-medium text-ink">Send money to the club:</p>
      <ul className="flex flex-wrap gap-3">
        {numbers.map((m) => (
          <li key={m.value} className="flex items-center gap-2">
            <span className="text-muted">{m.label}</span> <CopyNumber number={pay[m.value]} />
          </li>
        ))}
      </ul>
      {pay.reference && <p className="mt-2 text-xs text-subtle">Reference: {pay.reference}</p>}
    </div>
  );
}

function PaymentForm({ type, pay, disabled, onSent }) {
  const [values, setValues] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));
  const mobile = MOBILE_PAYMENT_METHODS.includes(values.method);
  const renewal = type === 'renewal';
  const methods = PAYMENT_METHODS.filter((m) => !MOBILE_PAYMENT_METHODS.includes(m.value) || pay[m.value]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiSecure.post('/payments/mine', { ...values, type, years: Number(values.years), amount: Number(values.amount) });
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
  return (
    <form onSubmit={submit} className="space-y-4">
      <HowToPay pay={pay} />
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
        <Select label="Paid with" name="method" value={values.method} onChange={set('method')} disabled={locked} options={methods} />
        {mobile && (
          <>
            <Input label="Number you paid from" name="paidFrom" required value={values.paidFrom} onChange={set('paidFrom')} disabled={locked} placeholder="01XXXXXXXXX" />
            <Input label="Transaction ID" name="transactionId" required value={values.transactionId} onChange={set('transactionId')} disabled={locked} placeholder="e.g. 9BX7K2L1QZ" />
          </>
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
                      {formatDate(p.paidAt)} · {METHOD[p.method] || p.method}
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
