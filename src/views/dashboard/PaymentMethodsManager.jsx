'use client';
import { useState } from 'react';
import { FaPlus, FaPen, FaArrowUp, FaArrowDown, FaExternalLinkAlt, FaExclamationTriangle } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import { apiSecure, apiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  KIND, MOBILE_ACCOUNT_TYPES, PAYMENT_KINDS, PAYMENT_PURPOSES, accountLine, isUsable, kindOf, methodsFor, newPaymentMethod,
} from '@/config/payment-methods';
import { KIND_ICONS } from '@/components/payments/PayTo';
import PageTitle from '@/components/dashboard/PageTitle';
import CrudModal from '@/components/dashboard/CrudModal';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Skeleton from '@/components/ui/Skeleton';

// Quick-add presets (the admin can still rename everything)
const PRESETS = [
  { label: 'bKash', kind: 'mobile' },
  { label: 'Nagad', kind: 'mobile' },
  { label: 'Rocket', kind: 'mobile' },
  { label: 'Upay', kind: 'mobile' },
  { label: 'Cash', kind: 'cash' },
  { label: 'Cheque', kind: 'cheque' },
  { label: 'Bank transfer', kind: 'bank' },
  { label: 'Other…', kind: 'other' },
];

function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50', checked ? 'bg-green-500' : 'bg-line/25')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  );
}

// Fields of the edit dialog — depend on the kind of method
function methodFields(values) {
  const kind = KIND[values.kind] || KIND.other;
  return [
    { name: 'label', label: 'Name shown to payers', required: true, placeholder: 'e.g. bKash' },
    { name: 'kind', label: 'Type', type: 'select', options: PAYMENT_KINDS.map((k) => ({ value: k.value, label: k.label })) },
    { type: 'heading', label: 'Where to pay' },
    {
      name: 'account',
      label: kind.accountLabel,
      required: values.enabled && kind.needsAccount,
      placeholder: values.kind === 'mobile' ? '01XXXXXXXXX' : values.kind === 'cash' ? 'e.g. Club room 2103, Sun–Thu 10am–3pm' : '',
      help: kind.needsAccount ? 'Without it, this method stays hidden on the website.' : undefined,
    },
    ...(values.kind === 'mobile' ? [{ name: 'accountType', label: 'Account type', type: 'select', options: MOBILE_ACCOUNT_TYPES.map((t) => ({ value: t, label: t })) }] : []),
    ...(['bank', 'cheque', 'other'].includes(values.kind) ? [{ name: 'accountName', label: values.kind === 'cheque' ? 'Payee name (written on the cheque)' : 'Account name', placeholder: 'South Asia Computer Club' }] : []),
    ...(values.kind === 'bank'
      ? [
          { name: 'bankName', label: 'Bank name', placeholder: 'e.g. Dutch-Bangla Bank' },
          { name: 'branch', label: 'Branch / routing', placeholder: 'e.g. Dhanmondi, routing 090261234' },
        ]
      : []),
    { name: 'instructions', label: 'Instructions for payers (optional)', type: 'textarea', rows: 2, placeholder: 'e.g. Use "Send Money", not "Cash Out". Write your student ID in the reference.' },
    { type: 'heading', label: 'Use it for' },
    ...PAYMENT_PURPOSES.map((p) => ({ name: `purpose_${p.value}`, label: `${p.label} — ${p.where}`, type: 'checkbox', full: true })),
    { name: 'enabled', label: 'Switched on (shown on the website)', type: 'checkbox', full: true },
  ];
}

const toForm = (m) => ({ ...m, ...Object.fromEntries(PAYMENT_PURPOSES.map((p) => [`purpose_${p.value}`, m.purposes.includes(p.value)])) });
const fromForm = (v) => {
  const { purpose_membership: _a, purpose_renewal: _b, purpose_donation: _c, ...rest } = v;
  return { ...rest, purposes: PAYMENT_PURPOSES.filter((p) => v[`purpose_${p.value}`]).map((p) => p.value) };
};

function MethodCard({ method, index, count, busy, onToggle, onTogglePurpose, onMove, onEdit }) {
  const kind = kindOf(method);
  const Icon = KIND_ICONS[method.kind] || KIND_ICONS.other;
  const missingAccount = method.enabled && !isUsable(method);
  return (
    <li className={cn('rounded-xl border bg-surface p-4 transition-colors', method.enabled ? 'border-line/10' : 'border-dashed border-line/15 opacity-75')}>
      <div className="flex items-start gap-3">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg', method.enabled ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' : 'bg-surface-2 text-subtle')}>
          <Icon aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{method.label}</p>
            <Badge>{kind.short}</Badge>
            {!method.enabled && <Badge color="red">Off</Badge>}
          </div>
          <p className="mt-0.5 truncate font-mono text-sm text-body">{accountLine(method) || <span className="font-sans text-subtle">No account details</span>}</p>
          {missingAccount && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
              <FaExclamationTriangle aria-hidden /> Hidden on the website until you add the {kind.accountLabel.toLowerCase()}.
            </p>
          )}
        </div>
        <Switch checked={method.enabled} onChange={onToggle} label={`${method.label} on / off`} disabled={busy} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {PAYMENT_PURPOSES.map((p) => {
          const on = method.purposes.includes(p.value);
          return (
            <button
              key={p.value}
              type="button"
              disabled={busy}
              aria-pressed={on}
              onClick={() => onTogglePurpose(p.value)}
              title={p.where}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50',
                on ? 'border-orange-500/60 bg-orange-500/10 text-orange-700 dark:text-orange-300' : 'border-line/15 text-subtle hover:border-orange-500/40'
              )}
            >
              {on ? '✓ ' : ''}{p.label}
            </button>
          );
        })}
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" disabled={busy || index === 0} onClick={() => onMove(-1)} aria-label="Move up"><FaArrowUp /></Button>
          <Button size="sm" variant="ghost" disabled={busy || index === count - 1} onClick={() => onMove(1)} aria-label="Move down"><FaArrowDown /></Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={onEdit}><FaPen /> Edit</Button>
        </div>
      </div>
    </li>
  );
}

// Dashboard → Payment Methods: which ways to pay the website offers, per purpose, with the club's account details
export default function PaymentMethodsManager() {
  const { data, setData, loading, error } = useApi('/settings/payments', { select: (res) => res.data });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [editing, setEditing] = useState(null); // { index, value } (index -1 = new)
  const [adding, setAdding] = useState(false);
  const methods = data?.methods || [];

  const save = async (next, message = 'Saved — the website uses the new payment methods now.') => {
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiSecure.put('/settings/payments', { methods: next });
      setData(res.data.data);
      setStatus({ type: 'success', message });
      return true;
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err) });
      throw err;
    } finally {
      setBusy(false);
    }
  };
  const quiet = (next, message) => save(next, message).catch(() => {});
  const update = (i, patch) => methods.map((m, j) => (j === i ? { ...m, ...patch } : m));

  const move = (i, dir) => {
    const next = [...methods];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    quiet(next, 'Order saved.');
  };

  const submitEdit = async (values) => {
    const method = fromForm(values);
    const next = editing.index < 0 ? [...methods, method] : update(editing.index, method);
    await save(next);
    setEditing(null);
  };

  const removeEditing = async () => {
    await save(methods.filter((_, j) => j !== editing.index), 'Payment method deleted. Old payments keep their method name.');
    setEditing(null);
  };

  const startNew = (preset) => {
    setAdding(false);
    setEditing({ index: -1, value: toForm({ ...newPaymentMethod(preset.kind), label: preset.kind === 'other' ? '' : preset.label }) });
  };

  return (
    <>
      <PageTitle
        title="Payment Methods"
        description="Choose how people can pay the joining fee, renew their membership or donate. Switch each method on or off and pick where it is offered."
        actions={
          <>
            <Button variant="secondary" href="/join" target="_blank"><FaExternalLinkAlt /> Join page</Button>
            <Button onClick={() => setAdding((a) => !a)} disabled={loading}><FaPlus /> Add method</Button>
          </>
        }
      />

      <Alert type="error" className="mb-4">{error}</Alert>
      <Alert type={status.type || 'info'} className="mb-4">{status.message}</Alert>

      {adding && (
        <Card className="mb-6" title="Add a payment method">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const Icon = KIND_ICONS[p.kind];
              return (
                <button key={p.label} type="button" onClick={() => startNew(p)} className="inline-flex items-center gap-2 rounded-lg border border-line/15 px-3 py-2 text-sm text-body transition-colors hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400">
                  <Icon aria-hidden /> {p.label}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" rounded="rounded-xl" />)}</div>
          ) : !methods.length ? (
            <Alert type="warning">No payment methods yet — people can’t pay online. Use “Add method”.</Alert>
          ) : (
            <ul className="space-y-3">
              {methods.map((m, i) => (
                <MethodCard
                  key={m.key || i}
                  method={m}
                  index={i}
                  count={methods.length}
                  busy={busy}
                  onToggle={(enabled) => quiet(update(i, { enabled }), `${m.label} is ${enabled ? 'on' : 'off'}.`)}
                  onTogglePurpose={(p) => quiet(update(i, { purposes: m.purposes.includes(p) ? m.purposes.filter((x) => x !== p) : [...m.purposes, p] }))}
                  onMove={(dir) => move(i, dir)}
                  onEdit={() => setEditing({ index: i, value: toForm(m) })}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Live summary: what each page offers right now */}
        <aside className="space-y-3">
          {PAYMENT_PURPOSES.map((p) => {
            const shown = methodsFor(methods, p.value);
            return (
              <Card key={p.value} className="p-4">
                <p className="text-sm font-semibold text-ink">{p.label}</p>
                <p className="text-xs text-subtle">{p.where}</p>
                {loading ? (
                  <Skeleton className="mt-3 h-6" />
                ) : shown.length ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {shown.map((m) => <li key={m.key}><Badge color="green">{m.label}</Badge></li>)}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">Nothing offered — payers can’t choose a method.</p>
                )}
              </Card>
            );
          })}
          <p className="px-1 text-xs text-subtle">
            Payers enter what the method needs: mobile banking → sender number + transaction ID, bank → transaction number, cheque → bank + cheque number, cash → money receipt (optional).
            Admins can record a payment with any method in Dashboard → Payments, even one that is switched off.
          </p>
        </aside>
      </div>

      {editing && (
        <CrudModal
          key={editing.index}
          open
          size="lg"
          title={editing.index < 0 ? 'New payment method' : `Edit ${editing.value.label}`}
          fields={methodFields}
          initial={editing.value}
          onSubmit={submitEdit}
          onDelete={editing.index >= 0 ? removeEditing : undefined}
          deleteMessage="It disappears from the website. Payments already made with it keep their records."
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
