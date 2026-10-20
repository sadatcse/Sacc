'use client';
import { useEffect, useState } from 'react';
import { FaHandHoldingHeart, FaArrowLeft, FaArrowRight, FaCheckCircle, FaPaperPlane } from 'react-icons/fa';
import { api, apiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { kindOf } from '@/config/payment-methods';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Input, Textarea } from '@/components/forms/FormField';
import PayTo, { KIND_ICONS } from './PayTo';

const PRESETS = [500, 1000, 2000, 5000];
const bdt = (n) => `${Number(n || 0).toLocaleString('en-US')} BDT`;
const EMPTY = { name: '', email: '', phone: '', batch: '', amount: '1000', note: '', method: '', paidFrom: '', transactionId: '' };
// The unfinished donation of this browser (so going back / reopening updates it instead of starting a new one)
const TOKEN_KEY = 'sacc-donation-token';
const storage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  },
  set: (value) => {
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage blocked */
    }
  },
};

// "Donate" on /alumni: 1) who you are + amount → 2) how you paid → 3) thank you.
// Step 1 is saved as an unfinished donation (Dashboard → Payments, "Not completed"); if it's never paid the donor gets
// reminder emails whose link (/alumni?donate=<token>) comes back here as `resume` and opens the payment step.
// `methods` = payment methods switched on for donations (Dashboard → Payment Methods); `donor` prefills a signed-in user.
export default function DonateButton({ methods = [], donor, resume, className, reference }) {
  const [open, setOpen] = useState(Boolean(resume));
  const [step, setStep] = useState(resume ? 2 : 1);
  const [token, setToken] = useState(resume?.token || '');
  const [values, setValues] = useState(() =>
    resume
      ? { ...EMPTY, ...Object.fromEntries(Object.entries(resume).filter(([k, v]) => k !== 'token' && v !== undefined && v !== null)), amount: String(resume.amount) }
      : { ...EMPTY, name: donor?.name || '', email: donor?.email || '' }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));
  const method = methods.find((m) => m.key === values.method);
  const kind = method && kindOf(method);
  const amount = Number(values.amount) || 0;

  // Arriving from a reminder link: that donation becomes this browser's unfinished one
  useEffect(() => {
    if (resume?.token) storage.set(resume.token);
  }, [resume]);
  // This browser's unfinished donation, so going back / reopening updates it instead of starting a new one
  const currentToken = () => token || storage.get();

  const close = () => {
    if (busy) return;
    setOpen(false);
    // Start over next time after a finished donation; keep a half-filled form otherwise
    if (done) {
      setDone(null);
      setStep(1);
      setValues((v) => ({ ...EMPTY, name: v.name, email: v.email, phone: v.phone, batch: v.batch }));
    }
  };

  // Step 1 → saved as an unfinished donation, then the payment step
  const next = async (e) => {
    e.preventDefault();
    if (amount < 10) return setError('Enter an amount of at least 10 BDT.');
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/payments/donate/start', { ...values, amount, token: currentToken() }, { withCredentials: true });
      setToken(res.data.data.token);
      storage.set(res.data.data.token);
      setStep(2);
    } catch (err) {
      setError(apiError(err, 'Could not continue. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!method) return setError('Choose how you paid.');
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/payments/donate', { ...values, amount, token: currentToken() }, { withCredentials: true });
      setDone({ ...res.data.data, message: res.data.message });
      setStep(3);
      setToken('');
      storage.set('');
    } catch (err) {
      if (err?.response?.status === 409) {
        setToken('');
        storage.set('');
      }
      setError(apiError(err, 'Could not send your donation. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const footer =
    step === 1 ? (
      <Button type="submit" form="donate-details" variant="brand" disabled={busy}>{busy ? 'Saving…' : 'Continue to payment'} <FaArrowRight /></Button>
    ) : step === 2 ? (
      <>
        <Button variant="secondary" className="mr-auto" onClick={() => setStep(1)} disabled={busy}><FaArrowLeft /> Back</Button>
        <Button type="submit" form="donate-payment" variant="brand" disabled={busy || !method}>
          <FaPaperPlane /> {busy ? 'Sending…' : `Submit ${bdt(amount)}`}
        </Button>
      </>
    ) : (
      <Button variant="brand" onClick={close}>Close</Button>
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-orange-500/60 bg-orange-500/10 px-5 py-2.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-500 hover:text-white dark:text-orange-300',
          className
        )}
      >
        <FaHandHoldingHeart aria-hidden /> Donate
      </button>

      <Modal open={open} onClose={close} title={step === 3 ? 'Thank you!' : 'Support the club'} footer={footer}>
        {step < 3 && (
          <ol className="mb-5 flex items-center gap-2 text-xs font-semibold" aria-label="Steps">
            {['Your details', 'Payment'].map((label, i) => (
              <li key={label} className={cn('flex items-center gap-2', step === i + 1 ? 'text-orange-600 dark:text-orange-400' : 'text-subtle')}>
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', step === i + 1 ? 'bg-orange-500 text-white' : step > i + 1 ? 'bg-green-500 text-white' : 'bg-line/10')}>{i + 1}</span>
                {label}
                {i === 0 && <span className="mx-1 h-px w-8 bg-line/20" aria-hidden />}
              </li>
            ))}
          </ol>
        )}

        {step === 1 && (
          <form id="donate-details" onSubmit={next} className="space-y-4">
            <p className="text-sm text-muted">Your donation helps students with programming contests, workshops, seminars and events. Every taka is recorded and confirmed by the committee.</p>
            <div>
              <span className="mb-2 block text-sm font-medium text-body">Amount (BDT)</span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setValues((v) => ({ ...v, amount: String(n) }))}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
                      amount === n ? 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300' : 'border-line/15 text-body hover:border-orange-500/50'
                    )}
                  >
                    {n.toLocaleString('en-US')}
                  </button>
                ))}
                <input
                  type="number"
                  min="10"
                  step="1"
                  required
                  aria-label="Other amount"
                  value={values.amount}
                  onChange={set('amount')}
                  className="h-10 w-32 rounded-lg border border-line/20 bg-surface px-3 text-sm text-ink focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" name="name" required value={values.name} onChange={set('name')} autoComplete="name" />
              <Input label="Email" name="email" type="email" required value={values.email} onChange={set('email')} autoComplete="email" />
              <Input label="Phone" name="phone" type="tel" required value={values.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" autoComplete="tel" />
              <Input label="Batch (optional)" name="batch" value={values.batch} onChange={set('batch')} placeholder="e.g. CSE 17" />
            </div>
            <Textarea label="Message to the club (optional)" name="note" rows={2} value={values.note} onChange={set('note')} />
            <Alert type="error">{error}</Alert>
          </form>
        )}

        {step === 2 && (
          <form id="donate-payment" onSubmit={submit} className="space-y-4">
            {resume && <Alert type="info">Welcome back, {values.name.split(' ')[0]}! Your donation of {bdt(amount)} is waiting — finish the payment below.</Alert>}
            {!methods.length ? (
              <Alert type="warning">Online donations aren’t open yet — please contact the club to donate.</Alert>
            ) : (
              <>
                <div>
                  <span className="mb-2 block text-sm font-medium text-body">How will you pay {bdt(amount)}?</span>
                  <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {methods.map((m) => {
                      const Icon = KIND_ICONS[m.kind] || KIND_ICONS.other;
                      return (
                        <label
                          key={m.key}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-line/15 px-3 py-2.5 text-sm font-medium text-body transition-colors hover:border-orange-500/50 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-500/10 has-[:checked]:text-ink"
                        >
                          <input type="radio" name="method" value={m.key} checked={values.method === m.key} onChange={set('method')} className="sr-only" />
                          <Icon className="text-orange-500" aria-hidden /> {m.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                {method && (
                  <>
                    <PayTo method={method} amount={bdt(amount)} reference={reference} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      {kind.from && (
                        <Input key={`from-${method.key}`} label={kind.from.required ? kind.from.label : `${kind.from.label} (optional)`} name="paidFrom" required={kind.from.required} value={values.paidFrom} onChange={set('paidFrom')} placeholder={kind.from.placeholder} />
                      )}
                      {kind.ref && (
                        <Input key={`ref-${method.key}`} label={kind.ref.required ? kind.ref.label : `${kind.ref.label} (optional)`} name="transactionId" required={kind.ref.required} value={values.transactionId} onChange={set('transactionId')} placeholder={kind.ref.placeholder} />
                      )}
                    </div>
                    <p className="text-xs text-subtle">Send the money first, then enter the details above so the committee can match your payment.</p>
                  </>
                )}
              </>
            )}
            <Alert type="error">{error}</Alert>
          </form>
        )}

        {step === 3 && done && (
          <div className="py-4 text-center">
            <FaCheckCircle className="mx-auto text-5xl text-green-600 dark:text-green-400" aria-hidden />
            <p className="mt-4 text-lg font-semibold text-ink">{bdt(done.amount)} — thank you, {values.name.split(' ')[0]}!</p>
            <p className="mt-2 text-sm text-muted">{done.message}</p>
            <p className="mt-4 text-xs text-subtle">
              Reference: <span className="font-mono text-body">{done.reference}</span> · Status: <span className="text-amber-600 dark:text-amber-400">waiting for a committee check</span>
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
