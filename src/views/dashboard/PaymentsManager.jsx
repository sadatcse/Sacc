'use client';
import { useMemo, useState } from 'react';
import { FaMoneyBillWave, FaHourglassHalf, FaRedo, FaHandHoldingHeart, FaPlus, FaIdCard, FaEnvelope, FaRegClock } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import usePagination from '@/hooks/usePagination';
import { apiSecure, apiError } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { toDateInput } from '@/lib/membership';
import { DONATION_REMINDER_DELAYS, PAYMENT_STATUSES, PAYMENT_TYPES, RENEW_YEARS } from '@/config/membership';
import { kindOf } from '@/config/payment-methods';
import usePaymentMethods from '@/hooks/usePaymentMethods';
import PageTitle from '@/components/dashboard/PageTitle';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import DataTable from '@/components/dashboard/DataTable';
import FilterBar from '@/components/dashboard/FilterBar';
import Pagination from '@/components/dashboard/Pagination';
import CrudModal from '@/components/dashboard/CrudModal';
import ExportButtons from '@/components/dashboard/ExportButtons';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Textarea } from '@/components/forms/FormField';

const TYPE = Object.fromEntries(PAYMENT_TYPES.map((t) => [t.value, t]));
const STATUS = Object.fromEntries(PAYMENT_STATUSES.map((s) => [s.value, s]));
const bdt = (n) => `${Number(n || 0).toLocaleString('en-US')} BDT`;

const exportColumns = (METHOD) => [
  ['Date', (p) => formatDate(p.paidAt)], ['Type', (p) => TYPE[p.type]?.label], ['Status', (p) => STATUS[p.status]?.label],
  ['Name', (p) => p.name], ['Student ID', (p) => p.studentId], ['Batch', (p) => p.batch], ['Email', (p) => p.email], ['Phone', (p) => p.phone],
  ['Amount (BDT)', (p) => Number(p.amount) || 0], ['Years', (p) => p.years || ''], ['Method', (p) => METHOD(p.method)],
  ['Paid from', (p) => p.paidFrom], ['Transaction ID', (p) => p.transactionId],
  ['Period', (p) => (p.periodEnd ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}` : '')],
  ['Note', (p) => p.note], ['Admin note', (p) => p.adminNote], ['Checked by', (p) => p.reviewedBy?.name],
];

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <dt className="text-subtle">{label}</dt>
      <dd className="col-span-2 break-words text-ink">{children || '—'}</dd>
    </div>
  );
}

const REMINDER_LABELS = ['after 30 minutes', 'after 3 days', 'after 7 days'];

// Reminder emails of an unfinished donation: what was sent, and when the next automatic one goes out
function Reminders({ payment }) {
  const log = payment.reminders || [];
  const nextStep = payment.remindersSent || 0;
  const nextAt = nextStep < DONATION_REMINDER_DELAYS.length && new Date(new Date(payment.createdAt).getTime() + DONATION_REMINDER_DELAYS[nextStep]);
  return (
    <div className="space-y-1 text-sm">
      {log.length ? (
        log.map((r, i) => (
          <p key={i} className="flex flex-wrap items-center gap-2">
            <FaEnvelope className={r.sent ? 'text-green-600' : 'text-red-500'} aria-hidden />
            {formatDate(r.at, true)} · {r.auto ? 'automatic' : 'sent by an admin'}
            {!r.sent && <span className="text-xs text-red-600 dark:text-red-400">(not sent: {r.error || 'unknown error'})</span>}
          </p>
        ))
      ) : (
        <p className="text-subtle">None yet.</p>
      )}
      {payment.email && nextAt && (
        <p className="flex items-center gap-2 text-xs text-subtle">
          <FaRegClock aria-hidden /> Next automatic reminder {REMINDER_LABELS[nextStep]}: {nextAt < new Date() ? 'in a few minutes' : formatDate(nextAt, true)}
        </p>
      )}
      {payment.email && !nextAt && <p className="text-xs text-subtle">All 3 automatic reminders have been sent.</p>}
      {!payment.email && <p className="text-xs text-subtle">No email address — reminders can’t be sent.</p>}
    </div>
  );
}

function PaymentDetail({ payment, methodName, onUpdated, onDeleted, onClose }) {
  const [note, setNote] = useState(payment.adminNote || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fixed = payment.type === 'membership'; // follows its application
  const draft = payment.status === 'draft'; // donation started on /alumni, payment never submitted

  const sendReminder = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await apiSecure.post(`/payments/${payment._id}/remind`);
      onUpdated(res.data.data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const update = async (status) => {
    setBusy(true);
    setError('');
    try {
      const res = await apiSecure.patch(`/payments/${payment._id}`, { ...(status && { status }), adminNote: note });
      onUpdated(res.data.data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await apiSecure.delete(`/payments/${payment._id}`);
      onDeleted(payment._id);
    } catch (err) {
      setError(apiError(err));
      setConfirmDelete(false);
      setBusy(false);
    }
  };

  return (
    <>
      <Modal
        open={!confirmDelete}
        onClose={busy ? undefined : onClose}
        title={`${TYPE[payment.type]?.label} · ${bdt(payment.amount)}`}
        footer={
          <>
            {!fixed && <Button variant="danger" className="mr-auto" onClick={() => setConfirmDelete(true)} disabled={busy}>Delete</Button>}
            <Button variant="secondary" onClick={() => update()} disabled={busy}>Save note</Button>
            {draft && payment.email && <Button variant="secondary" onClick={sendReminder} disabled={busy}><FaEnvelope /> Send reminder now</Button>}
            {!fixed && !draft && payment.status !== 'rejected' && <Button variant="secondary" onClick={() => update('rejected')} disabled={busy}>Reject</Button>}
            {!fixed && payment.status !== 'verified' && <Button onClick={() => update('verified')} disabled={busy}>Mark as received</Button>}
          </>
        }
      >
        <Alert type="error" className="mb-3">{error}</Alert>
        {draft && (
          <Alert type="warning" className="mb-3">
            The donor filled in their details but didn’t submit a payment. Reminder emails go out automatically. If they paid another way, check it and use “Mark as received”.
          </Alert>
        )}
        {payment.status === 'pending' && payment.type === 'renewal' && (
          <Alert type="info" className="mb-3">Check the transaction, then “Mark as received” — the membership is extended by {payment.years} year{payment.years > 1 ? 's' : ''}.</Alert>
        )}
        <dl className="divide-y divide-line/5">
          <Row label="Status"><Badge color={STATUS[payment.status]?.color}>{STATUS[payment.status]?.label}</Badge></Row>
          <Row label="Paid by">
            {payment.name}
            {payment.studentId && <span className="block text-xs text-subtle">ID {payment.studentId}{payment.batch && ` · ${payment.batch}`}</span>}
          </Row>
          <Row label="Contact">{[payment.email, payment.phone].filter(Boolean).join(' · ')}</Row>
          <Row label="Amount">{bdt(payment.amount)}{payment.years > 0 && ` for ${payment.years} year${payment.years > 1 ? 's' : ''}`}</Row>
          <Row label="Method">
            {methodName(payment.method)}
            {payment.transactionId && <span className="block font-mono text-xs">TrxID {payment.transactionId}{payment.paidFrom && ` · from ${payment.paidFrom}`}</span>}
          </Row>
          <Row label="Date">{formatDate(payment.paidAt, true)}</Row>
          {payment.periodEnd && <Row label="Membership period">{formatDate(payment.periodStart)} – {formatDate(payment.periodEnd)}</Row>}
          {payment.note && <Row label="Message">{payment.note}</Row>}
          {(draft || payment.reminders?.length > 0) && <Row label="Reminders"><Reminders payment={payment} /></Row>}
          <Row label="Checked by">{payment.reviewedBy?.name && `${payment.reviewedBy.name} · ${formatDate(payment.reviewedAt)}`}{payment.recordedBy && ' (recorded by admin)'}</Row>
        </dl>
        {fixed && <p className="mt-3 text-xs text-subtle">The joining fee is recorded from the membership application and follows its approval.</p>}
        <div className="mt-4">
          <Textarea label="Admin note (private)" name="adminNote" rows={2} value={note} onChange={(e) => setNote(e.target.value)} disabled={busy} />
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete payment?"
        message={payment.type === 'renewal' && payment.status === 'verified' ? 'The renewal it added to the membership will be taken back.' : 'This payment record will be removed.'}
        confirmLabel="Delete"
        loading={busy}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

// Form for a payment received outside the website (e.g. cash at the club desk)
function recordFields(values, members, renewFee, methods) {
  const method = methods.find((m) => m.key === values.method);
  const kind = kindOf(method);
  return [
    { name: 'type', label: 'Payment for', type: 'select', options: [{ value: 'renewal', label: 'Membership renewal' }, { value: 'donation', label: 'Donation' }] },
    { name: 'paidAt', label: 'Date received', type: 'date' },
    ...(values.type === 'renewal'
      ? [
          { name: 'application', label: 'Member', type: 'select', required: true, full: true, options: [{ value: '', label: members ? 'Choose a member…' : 'Loading…' }, ...(members || []).map((m) => ({ value: m._id, label: `${m.name} · ${m.studentId} · ${m.batch}` }))] },
          { name: 'years', label: 'Renew for', type: 'select', options: RENEW_YEARS.map((y) => ({ value: String(y), label: `${y} year${y > 1 ? 's' : ''} (${bdt(renewFee * y)})` })) },
          { name: 'amount', label: 'Amount received (BDT)', type: 'number', placeholder: String(renewFee * Number(values.years || 1)), help: 'Leave empty to use the renewal fee.' },
        ]
      : [
          { name: 'name', label: 'Donor name', required: true },
          { name: 'amount', label: 'Amount (BDT)', type: 'number', required: true },
          { name: 'email', label: 'Email', type: 'email', help: 'Links the donation to the alumnus’ account if it matches.' },
          { name: 'phone', label: 'Phone' },
        ]),
    // Every configured method (also switched-off ones — e.g. a cheque received once)
    { name: 'method', label: 'Method', type: 'select', required: true, options: [{ value: '', label: 'Choose…' }, ...methods.map((m) => ({ value: m.key, label: m.enabled ? m.label : `${m.label} (off)` }))] },
    ...(method && kind.from ? [{ name: 'paidFrom', label: kind.from.label, required: kind.from.required, placeholder: kind.from.placeholder }] : []),
    ...(method && kind.ref ? [{ name: 'transactionId', label: kind.ref.label, required: kind.ref.required, placeholder: kind.ref.placeholder }] : []),
    { name: 'note', label: 'Note', type: 'textarea', rows: 2, full: true },
  ];
}

export default function PaymentsManager() {
  const { data, setData, loading, error, reload } = useApi('/payments', { initialData: { rows: [], stats: null }, select: (res) => res.data });
  const settings = useApi('/settings/membership', { select: (res) => res.data });
  const payMethods = usePaymentMethods();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [recording, setRecording] = useState(false);
  const [members, setMembers] = useState(null);
  const rows = data.rows;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (p) =>
        (type === 'all' || p.type === type) &&
        (status === 'all' || p.status === status) &&
        (!q || [p.name, p.email, p.phone, p.studentId, p.transactionId, p.paidFrom].some((f) => f?.toLowerCase().includes(q)))
    );
  }, [rows, search, type, status]);
  const { page, setPage, pageCount, pageItems } = usePagination(filtered, 20);
  const filteredTotal = filtered.filter((p) => p.status === 'verified').reduce((n, p) => n + (Number(p.amount) || 0), 0);

  const openRecord = () => {
    setRecording(true);
    if (!members) apiSecure.get('/members').then((res) => setMembers(res.data.data.members)).catch(() => setMembers([]));
  };

  const record = async (values) => {
    const res = await apiSecure.post('/payments', { ...values, years: Number(values.years) });
    await reload();
    setRecording(false);
    setSelected(res.data.data);
  };

  const replace = (row) => setData((d) => ({ ...d, rows: d.rows.map((p) => (p._id === row._id ? row : p)) }));
  const s = data.stats;
  const renewFee = settings.data?.renewFee ?? 0;

  const columns = [
    {
      key: 'name',
      header: 'Paid by',
      render: (p) => (
        <div>
          <p className={p.status === 'pending' ? 'font-semibold text-ink' : 'text-ink'}>{p.name || '—'}</p>
          <p className="text-xs text-subtle">{[p.studentId, p.batch, p.email].filter(Boolean).join(' · ')}</p>
        </div>
      ),
    },
    { key: 'type', header: 'For', render: (p) => <Badge color={TYPE[p.type]?.color}>{TYPE[p.type]?.label}{p.years ? ` · ${p.years} yr` : ''}</Badge> },
    { key: 'amount', header: 'Amount', render: (p) => <span className="font-semibold text-ink">{bdt(p.amount)}</span>, className: 'whitespace-nowrap' },
    {
      key: 'method',
      header: 'Method',
      render: (p) => (
        <div className="text-xs">
          <p className="font-medium text-ink-2">{payMethods.label(p.method) || '—'}</p>
          {p.transactionId && <p className="font-mono text-subtle">{p.transactionId}</p>}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (p) => <Badge color={STATUS[p.status]?.color}>{STATUS[p.status]?.label}</Badge> },
    { key: 'paidAt', header: 'Date', render: (p) => formatDate(p.paidAt), className: 'whitespace-nowrap' },
  ];

  return (
    <>
      <PageTitle
        title="Payments"
        description={
          <>
            Every amount received: joining fees, membership renewals and alumni donations. Renewal fee is{' '}
            <span className="font-semibold">{settings.data ? `${bdt(renewFee)} / year` : '…'}</span> (change it in Membership → Registration settings).
            Accepted methods: <a href="/dashboard/payment-methods" className="font-semibold text-orange-600 hover:underline dark:text-orange-400">Payment Methods</a>.
          </>
        }
        actions={
          <>
            <ExportButtons filename="payments" title="Payments received" load={() => ({ columns: exportColumns(payMethods.label), rows: filtered })} disabled={!filtered.length} />
            <Button onClick={openRecord}><FaPlus /> Record payment</Button>
          </>
        }
      />

      <StatGrid>
        <StatCard label="Total received" value={s && bdt(s.received.amount)} hint={s && `${s.received.count} payments`} icon={FaMoneyBillWave} tone="green" loading={loading} />
        <StatCard label="Joining fees" value={s && bdt(s.membership.amount)} hint={s && `${s.membership.count} members`} icon={FaIdCard} tone="blue" loading={loading} />
        <StatCard label="Renewals" value={s && bdt(s.renewal.amount)} hint={s && `${s.renewal.count} renewals`} icon={FaRedo} tone="gray" loading={loading} />
        <StatCard label="Donations" value={s && bdt(s.donation.amount)} hint={s && `${s.donation.count} donations`} icon={FaHandHoldingHeart} tone="amber" loading={loading} />
      </StatGrid>

      {s?.draft?.count > 0 && (
        <button type="button" onClick={() => setStatus('draft')} className="mb-4 flex w-full items-center gap-2 rounded-lg border border-line/15 bg-surface-2 px-4 py-3 text-left text-sm text-body">
          <FaHandHoldingHeart aria-hidden className="text-orange-500" /> {s.draft.count} donation{s.draft.count > 1 ? 's were' : ' was'} started but not completed ({bdt(s.draft.amount)}) — the donors get reminder emails. Show them →
        </button>
      )}

      {s?.pending.count > 0 && (
        <button type="button" onClick={() => setStatus('pending')} className="mb-4 flex w-full items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-800 dark:text-amber-200">
          <FaHourglassHalf aria-hidden /> {s.pending.count} payment{s.pending.count > 1 ? 's are' : ' is'} waiting for a check ({bdt(s.pending.amount)}). Show them →
        </button>
      )}

      <Alert type="error" className="mb-4">{error}</Alert>

      <Card className="p-0">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search name, ID, phone, TrxID…"
          filters={[
            { key: 'type', value: type, onChange: setType, options: [{ value: 'all', label: 'All payments' }, ...PAYMENT_TYPES] },
            { key: 'status', value: status, onChange: setStatus, options: [{ value: 'all', label: 'All statuses' }, ...PAYMENT_STATUSES] },
          ]}
        />
        <DataTable columns={columns} rows={pageItems} loading={loading} onRowClick={setSelected} emptyTitle="No payments yet" emptyDescription="Joining fees appear when applications are approved." />
        <p className="border-t border-line/10 px-4 py-3 text-sm text-muted">
          {filtered.length} payment{filtered.length === 1 ? '' : 's'} · received in this list: <span className="font-semibold text-ink">{bdt(filteredTotal)}</span>
        </p>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>

      {selected && (
        <PaymentDetail
          key={selected._id}
          payment={selected}
          methodName={payMethods.label}
          onClose={() => setSelected(null)}
          onUpdated={(row) => {
            replace(row);
            setSelected(row);
            reload();
          }}
          onDeleted={() => {
            setSelected(null);
            reload();
          }}
        />
      )}

      {recording && (
        <CrudModal
          open
          title="Record a payment"
          fields={(values) => recordFields(values, members, renewFee, payMethods.methods)}
          initial={{ type: 'renewal', years: '1', method: payMethods.methods.find((m) => m.kind === 'cash')?.key || '', paidAt: toDateInput(new Date()), application: '' }}
          onSubmit={record}
          submitLabel="Save as received"
          onClose={() => setRecording(false)}
        />
      )}
    </>
  );
}
