'use client';
import { useEffect, useMemo, useState } from 'react';
import { FaUserPlus, FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaCog, FaExternalLinkAlt } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import usePagination from '@/hooks/usePagination';
import { apiSecure, apiError } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { APPLICATION_STATUSES, GENDER_OPTIONS, PAYMENT_METHODS, PAYMENT_STATUSES, PAYMENT_TYPES, SHIFT_OPTIONS } from '@/config/membership';
import { toDateInput } from '@/lib/membership';
import ExportButtons from '@/components/dashboard/ExportButtons';
import PageTitle from '@/components/dashboard/PageTitle';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import DataTable from '@/components/dashboard/DataTable';
import FilterBar from '@/components/dashboard/FilterBar';
import Pagination from '@/components/dashboard/Pagination';
import CrudModal from '@/components/dashboard/CrudModal';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Textarea } from '@/components/forms/FormField';

const STATUS = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s.value, s]));
const PAYMENT_LABELS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));
const SHIFT_LABELS = Object.fromEntries(SHIFT_OPTIONS.map((s) => [s.value, s.label]));
const fullName = (a) => `${a.firstName} ${a.lastName}`;
const photoUrl = (a) => `/api/membership/${a._id}/photo`;

const SETTINGS_FIELDS = [
  { name: 'open', label: 'Registration is open (the form accepts applications)', type: 'checkbox', full: true },
  { name: 'notice', label: 'Notice shown above the form', full: true, placeholder: 'Registration is open now.' },
  { name: 'fee', label: 'Membership fee (BDT)', type: 'number', required: true },
  { name: 'renewFee', label: 'Renewal fee per year (BDT)', type: 'number', required: true, help: 'Members renew for 1–3 years from Account → Payments.' },
  { name: 'reference', label: 'Payment reference instruction', placeholder: 'Your name_Student ID' },
  { type: 'heading', label: 'Club receiving numbers (leave empty to hide a method)' },
  { name: 'bkash', label: 'bKash number', placeholder: '01XXXXXXXXX' },
  { name: 'nagad', label: 'Nagad number', placeholder: '01XXXXXXXXX' },
  { name: 'rocket', label: 'Rocket number', placeholder: '01XXXXXXXXX' },
];

const CSV_COLUMNS = [
  ['Submitted', (a) => formatDate(a.createdAt, true)], ['Status', (a) => a.status], ['First name', (a) => a.firstName], ['Last name', (a) => a.lastName],
  ['Student ID', (a) => a.studentId], ['Department', (a) => a.department], ['Batch', (a) => a.batch], ['Shift', (a) => SHIFT_LABELS[a.shift]], ['Gender', (a) => a.gender],
  ['Email', (a) => a.personalEmail], ['Phone', (a) => a.phone], ['Backup phone', (a) => a.backupPhone],
  ['T-shirt', (a) => a.tshirtSize], ['Blood group', (a) => a.bloodGroup], ['Facebook', (a) => a.facebook], ['Payment', (a) => PAYMENT_LABELS[a.paymentMethod]],
  ['Paid from', (a) => a.paymentFrom], ['Transaction ID', (a) => a.transactionId], ['Amount', (a) => a.amount], ['Soft skills', (a) => a.softSkills.join('; ')],
  ['Joined', (a) => (a.joinedAt ? formatDate(a.joinedAt) : '')], ['Valid until', (a) => (a.expiresAt ? formatDate(a.expiresAt) : '')],
  ['Experience', (a) => a.experience], ['Admin note', (a) => a.adminNote],
];

const PAY_TYPE = Object.fromEntries(PAYMENT_TYPES.map((t) => [t.value, t]));
const PAY_STATUS = Object.fromEntries(PAYMENT_STATUSES.map((s) => [s.value, s]));

// Every payment linked to this application (joining fee + renewals)
function PaymentHistory({ appId, refreshKey }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let active = true;
    apiSecure
      .get(`/payments?application=${appId}`)
      .then((res) => active && setRows(res.data.data.rows))
      .catch(() => active && setRows([]));
    return () => {
      active = false;
    };
  }, [appId, refreshKey]);
  if (!rows) return <p className="text-sm text-subtle">Loading payments…</p>;
  if (!rows.length) return <p className="text-sm text-subtle">No payments recorded yet.</p>;
  return (
    <ul className="divide-y divide-line/5 rounded-lg border border-line/10">
      {rows.map((p) => (
        <li key={p._id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
          <Badge color={PAY_TYPE[p.type]?.color}>{PAY_TYPE[p.type]?.label}{p.years ? ` · ${p.years} yr` : ''}</Badge>
          <span className="font-semibold text-ink">{p.amount} BDT</span>
          <span className="text-xs text-subtle">{PAYMENT_LABELS[p.method] || p.method}{p.transactionId && ` · ${p.transactionId}`} · {formatDate(p.paidAt)}</span>
          <Badge color={PAY_STATUS[p.status]?.color} className="ml-auto">{PAY_STATUS[p.status]?.label}</Badge>
        </li>
      ))}
    </ul>
  );
}


function Row({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <dt className="text-subtle">{label}</dt>
      <dd className="col-span-2 break-words text-ink">{children || '—'}</dd>
    </div>
  );
}

function ApplicationDetail({ app, onUpdated, onDeleted, onClose }) {
  const [note, setNote] = useState(app.adminNote || '');
  const [gender, setGender] = useState(app.gender || '');
  const [joinedAt, setJoinedAt] = useState(toDateInput(app.joinedAt));
  const [expiresAt, setExpiresAt] = useState(toDateInput(app.expiresAt));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const review = async (status) => {
    setBusy(true);
    setError('');
    try {
      // The membership dates are only sent while the application stays approved
      const dates = app.status === 'approved' && !status ? { joinedAt, expiresAt } : {};
      const res = await apiSecure.patch(`/membership/${app._id}`, { ...(status && { status }), adminNote: note, gender, ...dates });
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
      await apiSecure.delete(`/membership/${app._id}`);
      onDeleted(app._id);
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
        size="lg"
        onClose={busy ? undefined : onClose}
        title={fullName(app)}
        footer={
          <>
            <Button variant="danger" className="mr-auto" onClick={() => setConfirmDelete(true)} disabled={busy}>Delete</Button>
            <Button variant="secondary" onClick={() => review()} disabled={busy}>Save changes</Button>
            {app.status !== 'draft' && <Button variant="secondary" onClick={() => review('draft')} disabled={busy}>Back to draft</Button>}
            {app.status !== 'rejected' && <Button variant="secondary" onClick={() => review('rejected')} disabled={busy}>Reject</Button>}
            {app.status !== 'approved' && <Button onClick={() => review('approved')} disabled={busy}>Approve</Button>}
          </>
        }
      >
        <Alert type="error" className="mb-3">{error}</Alert>
        <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
          <div>
            <a href={photoUrl(app)} target="_blank" rel="noopener noreferrer" title="Open full size">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-only photo served by the API */}
              <img src={photoUrl(app)} alt={`Photo of ${fullName(app)}`} className="aspect-[3/4] w-full rounded-lg border border-line/10 object-cover" />
            </a>
            <div className="mt-3 text-center">
              <Badge color={STATUS[app.status]?.color}>{STATUS[app.status]?.label}</Badge>
              {app.reviewedBy && <p className="mt-1 text-xs text-subtle">by {app.reviewedBy.name} · {formatDate(app.reviewedAt)}</p>}
            </div>
          </div>
          <div>
            <dl className="divide-y divide-line/5">
              <Row label="Student ID">{app.studentId}</Row>
              <Row label="Department">{app.department}</Row>
              <Row label="Batch / Shift">{[app.batch, SHIFT_LABELS[app.shift]].filter(Boolean).join(' · ')}</Row>
              <Row label="Gender">
                <select value={gender} onChange={(e) => setGender(e.target.value)} disabled={busy} className="rounded-md border border-line/15 bg-surface px-2 py-1 text-sm text-ink" aria-label="Gender">
                  <option value="">Not set</option>
                  {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
                {gender !== (app.gender || '') && <span className="ml-2 text-xs text-subtle">press Save below</span>}
              </Row>
              <Row label="Phone (WhatsApp)">{app.phone}{app.backupPhone && ` · backup ${app.backupPhone}`}</Row>
              <Row label="Email"><a href={`mailto:${app.personalEmail}`} className="text-primary-600 dark:text-primary-400 hover:underline">{app.personalEmail}</a></Row>
              <Row label="Blood / T-shirt">{app.bloodGroup} · {app.tshirtSize}</Row>
              <Row label="Facebook">{app.facebook && <a href={app.facebook} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">Open profile</a>}</Row>
              <Row label="Payment">
                {PAYMENT_LABELS[app.paymentMethod]} · {app.amount} BDT
                {app.transactionId && <span className="block font-mono text-xs">TrxID {app.transactionId} · from {app.paymentFrom}</span>}
              </Row>
              <Row label="Submitted">{formatDate(app.createdAt, true)}</Row>
              {app.status === 'approved' && (
                <Row label="Membership">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-subtle">
                      Joined{' '}
                      <input type="date" value={joinedAt} onChange={(e) => setJoinedAt(e.target.value)} disabled={busy} className="rounded-md border border-line/15 bg-surface px-2 py-1 text-sm text-ink" />
                    </label>
                    <label className="text-xs text-subtle">
                      Valid until{' '}
                      <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} disabled={busy} className="rounded-md border border-line/15 bg-surface px-2 py-1 text-sm text-ink" />
                    </label>
                    <Badge color={app.expired ? 'red' : 'green'}>{app.expired ? 'expired' : 'active'}</Badge>
                  </div>
                </Row>
              )}
            </dl>
          </div>
        </div>

        {app.softSkills?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-body">Soft skills</p>
            <div className="flex flex-wrap gap-1.5">
              {app.softSkills.map((s) => <Badge key={s} color="blue">{s}</Badge>)}
            </div>
          </div>
        )}
        {app.experience && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-body">Experience</p>
            <p className="whitespace-pre-wrap rounded-lg bg-canvas p-3 text-sm text-body">{app.experience}</p>
          </div>
        )}
        {app.status === 'approved' && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-body">Payments</p>
            <PaymentHistory appId={app._id} refreshKey={app.expiresAt} />
          </div>
        )}
        <div className="mt-4">
          <Textarea label="Admin note (private)" name="adminNote" rows={2} value={note} onChange={(e) => setNote(e.target.value)} disabled={busy} placeholder="e.g. payment verified" />
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete application?"
        message={`${fullName(app)}'s application and photo will be removed permanently.`}
        confirmLabel="Delete"
        loading={busy}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

export default function MembershipManager() {
  const { data: apps, setData: setApps, loading, error, reload } = useApi('/membership', { initialData: [], select: (res) => res.data || [] });
  const settings = useApi('/settings/membership', { select: (res) => res.data });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [shift, setShift] = useState('all');
  const [gender, setGender] = useState('all');
  const [batch, setBatch] = useState('all');
  const batches = useMemo(() => [...new Set(apps.map((a) => a.batch).filter(Boolean))].sort((a, b) => b.localeCompare(a, undefined, { numeric: true })), [apps]);
  const [selected, setSelected] = useState(null);
  const [editingSettings, setEditingSettings] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return apps.filter(
      (a) =>
        (status === 'all' || a.status === status) &&
        (shift === 'all' || a.shift === shift) &&
        (gender === 'all' || (a.gender || '') === (gender === 'unset' ? '' : gender)) &&
        (batch === 'all' || a.batch === batch) &&
        (!q || [fullName(a), a.studentId, a.batch, a.phone, a.personalEmail, a.transactionId].some((f) => f?.toLowerCase().includes(q)))
    );
  }, [apps, search, status, shift, gender, batch]);
  const { page, setPage, pageCount, pageItems } = usePagination(filtered, 15);
  const count = (s) => apps.filter((a) => a.status === s).length;

  const saveSettings = async (values) => {
    const res = await apiSecure.put('/settings/membership', { ...values, fee: Number(values.fee), renewFee: Number(values.renewFee) });
    settings.setData(res.data.data);
    setEditingSettings(false);
  };

  const columns = [
    {
      key: 'name',
      header: 'Applicant',
      render: (a) => (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-only photo served by the API */}
          <img src={photoUrl(a)} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          <div>
            <p className={a.status === 'draft' ? 'font-semibold text-ink' : 'text-ink'}>{fullName(a)}</p>
            <p className="text-xs text-subtle">{a.personalEmail}</p>
          </div>
        </div>
      ),
    },
    { key: 'studentId', header: 'Student ID', className: 'font-mono text-xs' },
    { key: 'batch', header: 'Batch · Shift', render: (a) => `${a.batch} · ${SHIFT_LABELS[a.shift] || ''}`, className: 'whitespace-nowrap' },
    {
      key: 'payment',
      header: 'Payment',
      render: (a) => (
        <div className="text-xs">
          <p className="font-medium text-ink-2">{PAYMENT_LABELS[a.paymentMethod]}</p>
          {a.transactionId && <p className="font-mono text-subtle">{a.transactionId}</p>}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (a) => <Badge color={STATUS[a.status]?.color}>{STATUS[a.status]?.label}</Badge> },
    { key: 'createdAt', header: 'Submitted', render: (a) => formatDate(a.createdAt, true), className: 'whitespace-nowrap' },
  ];

  const s = settings.data;

  return (
    <>
      <PageTitle
        title="Membership"
        description={
          s ? (
            <>
              Applications from the <a href="/join" target="_blank" className="text-primary-600 dark:text-primary-400 hover:underline">Join page <FaExternalLinkAlt className="inline text-[10px]" /></a>.
              New ones arrive as drafts. Registration is{' '}
              <span className={s.open ? 'font-semibold text-green-700' : 'font-semibold text-red-600'}>{s.open ? 'open' : 'closed'}</span> · fee {s.fee} BDT · renewal {s.renewFee} BDT / year.
            </>
          ) : 'Applications from the Join page.'
        }
        actions={
          <>
            <ExportButtons filename="membership-applications" title="Membership applications" load={() => ({ columns: CSV_COLUMNS, rows: filtered })} disabled={!filtered.length} />
            <Button variant="secondary" onClick={() => setEditingSettings(true)} disabled={!s}><FaCog /> Registration settings</Button>
            <Button variant="secondary" onClick={reload} disabled={loading}>Refresh</Button>
          </>
        }
      />

      <StatGrid>
        <StatCard label="All applications" value={apps.length} icon={FaUserPlus} tone="gray" loading={loading} />
        <StatCard label="Drafts to review" value={count('draft')} icon={FaHourglassHalf} tone="amber" loading={loading} />
        <StatCard label="Approved members" value={count('approved')} icon={FaCheckCircle} tone="green" loading={loading} />
        <StatCard label="Rejected" value={count('rejected')} icon={FaTimesCircle} tone="red" loading={loading} />
      </StatGrid>

      <Alert type="error" className="mb-4">{error || settings.error}</Alert>

      <Card className="p-0">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search name, ID, phone, email, TrxID…"
          filters={[
            { key: 'status', value: status, onChange: setStatus, options: [{ value: 'all', label: 'All statuses' }, ...APPLICATION_STATUSES.map((x) => ({ value: x.value, label: x.label }))] },
            { key: 'shift', value: shift, onChange: setShift, options: [{ value: 'all', label: 'Day & Evening' }, ...SHIFT_OPTIONS] },
            { key: 'batch', value: batch, onChange: setBatch, options: [{ value: 'all', label: 'All batches' }, ...batches.map((b) => ({ value: b, label: b }))] },
            { key: 'gender', value: gender, onChange: setGender, options: [{ value: 'all', label: 'All genders' }, ...GENDER_OPTIONS, { value: 'unset', label: 'Gender not set' }] },
          ]}
        />
        <DataTable columns={columns} rows={pageItems} loading={loading} onRowClick={setSelected} emptyTitle="No applications yet" emptyDescription="Share the /join link to start receiving applications." />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>

      {selected && (
        <ApplicationDetail
          key={selected._id}
          app={selected}
          onClose={() => setSelected(null)}
          onUpdated={(row) => {
            setApps((list) => list.map((a) => (a._id === row._id ? row : a)));
            setSelected(row);
          }}
          onDeleted={(id) => {
            setApps((list) => list.filter((a) => a._id !== id));
            setSelected(null);
          }}
        />
      )}

      {editingSettings && s && (
        <CrudModal
          open
          title="Registration settings"
          fields={SETTINGS_FIELDS}
          initial={s}
          onSubmit={saveSettings}
          onClose={() => setEditingSettings(false)}
        />
      )}
    </>
  );
}
