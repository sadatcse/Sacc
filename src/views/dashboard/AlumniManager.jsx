'use client';
import { useMemo, useState } from 'react';
import { FaPlus, FaUserGraduate, FaCheckCircle, FaHourglassHalf, FaCheck, FaTimes, FaEyeSlash } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import usePagination from '@/hooks/usePagination';
import { apiSecure, apiError } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { LINK_FIELDS, PROFILE_CONFIG, formField } from '@/config/profiles';
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

// Same fields alumni edit themselves (src/config/profiles.js), plus admin-only ones
const FIELDS = [
  { name: 'name', label: 'Full name', required: true },
  { name: 'featured', label: 'Club position badge', placeholder: "President '24", help: 'Highlighted on the directory card and profile.' },
  ...PROFILE_CONFIG.alumni.fields.flatMap((f) => {
    if (f.type === 'heading') return [{ type: 'heading', label: f.label }];
    if (f.type === 'links') return [{ type: 'heading', label: 'Links' }, ...LINK_FIELDS.map((l) => ({ name: `links.${l.name}`, label: l.label, type: l.name === 'email' ? 'email' : 'url' }))];
    return [formField(f.name, f)];
  }),
  { type: 'heading', label: 'Visibility' },
  { name: 'approved', label: 'Show in the public directory (and the profile page)', type: 'checkbox', full: true },
];

// Students asking to become alumni (Account → Become Alumni). Approve = their account becomes alumni.
function AlumniRequests({ onApproved }) {
  const { data: requests, setData: setRequests, loading } = useApi('/alumni-requests?status=pending', { initialData: [], select: (res) => res.data || [] });
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const decide = async (req, status) => {
    setBusy(req._id);
    setMessage({ type: '', text: '' });
    try {
      const res = await apiSecure.patch(`/alumni-requests/${req._id}`, { status, adminNote: notes[req._id] || '' });
      setRequests((list) => list.filter((r) => r._id !== req._id));
      setMessage({ type: 'success', text: `${req.name}: ${res.data.message}` });
      if (status === 'approved') onApproved();
    } catch (err) {
      setMessage({ type: 'error', text: apiError(err) });
    } finally {
      setBusy(null);
    }
  };

  if (loading || (!requests.length && !message.text)) return null;
  return (
    <Card className="mb-6 border-amber-500/40" title={`Requests to become alumni (${requests.length})`}>
      <Alert type={message.type || 'info'} className="mb-3">{message.text}</Alert>
      {!requests.length && <p className="text-sm text-subtle">No requests waiting.</p>}
      <ul className="divide-y divide-line/10">
        {requests.map((r) => (
          <li key={r._id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-ink">
                {r.name} <span className="font-normal text-subtle">· {r.email}</span>
              </p>
              <p className="mt-0.5 text-sm text-muted">
                ID {r.studentId} · {r.batch}{r.shift && ` (${r.shift})`} · graduated {r.graduationYear}
                {(r.jobTitle || r.company) && ` · now ${[r.jobTitle, r.company].filter(Boolean).join(' @ ')}`}
              </p>
              {r.note && <p className="mt-1 text-sm italic text-body">“{r.note}”</p>}
              <p className="mt-1 flex items-center gap-2 text-xs text-subtle">
                Sent {formatDate(r.createdAt)}
                {r.hideProfile && <span className="inline-flex items-center gap-1"><FaEyeSlash aria-hidden /> wants the profile hidden</span>}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={notes[r._id] || ''}
                onChange={(e) => setNotes((n) => ({ ...n, [r._id]: e.target.value }))}
                placeholder="Note to the student (optional)"
                className="h-9 rounded-lg border border-line/15 bg-surface px-3 text-sm text-ink placeholder-faint focus:border-primary-500 focus:outline-none sm:w-56"
              />
              <Button size="sm" onClick={() => decide(r, 'approved')} disabled={busy === r._id}><FaCheck /> Approve</Button>
              <Button size="sm" variant="secondary" onClick={() => decide(r, 'rejected')} disabled={busy === r._id}><FaTimes /> Reject</Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function AlumniManager() {
  const { data: rows, setData: setRows, loading, error, reload } = useApi('/alumni?all=1', { initialData: [], select: (res) => res.data || [] });
  const [search, setSearch] = useState('');
  const [approved, setApproved] = useState('all');
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (a) =>
        (approved === 'all' || a.approved === (approved === 'yes')) &&
        (!q || [a.name, a.batch, a.jobTitle, a.company, a.user?.email].some((f) => f?.toLowerCase().includes(q)))
    );
  }, [rows, search, approved]);
  const { page, setPage, pageCount, pageItems } = usePagination(filtered, 15);
  const replace = (row) => setRows((list) => list.map((a) => (a._id === row._id ? row : a)));

  const save = async (values) => {
    if (editing._id) {
      const res = await apiSecure.patch(`/alumni/${editing._id}`, values);
      replace(res.data.data);
    } else {
      const res = await apiSecure.post('/alumni', values);
      setRows((list) => [res.data.data, ...list]);
    }
    setEditing(null);
  };

  const remove = async () => {
    await apiSecure.delete(`/alumni/${editing._id}`);
    setRows((list) => list.filter((a) => a._id !== editing._id));
    setEditing(null);
  };

  const toggleApproved = async (row, e) => {
    e.stopPropagation();
    setActionError('');
    try {
      const res = await apiSecure.patch(`/alumni/${row._id}`, { approved: !row.approved });
      replace(res.data.data);
    } catch (err) {
      setActionError(apiError(err));
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Alumnus',
      render: (a) => (
        <div>
          <p className="font-medium text-ink">{a.name}</p>
          <p className="text-xs text-subtle">{a.user ? `Account: ${a.user.email}` : 'No login (added by admin)'}</p>
          {a.approved && a.slug && (
            <a href={`/alumni/${a.slug}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-primary-600 hover:underline dark:text-primary-400">
              View profile ↗
            </a>
          )}
        </div>
      ),
    },
    { key: 'batch', header: 'Batch' },
    { key: 'work', header: 'Works at', render: (a) => [a.jobTitle, a.company].filter(Boolean).join(' @ ') || '—' },
    {
      key: 'approved',
      header: 'Directory',
      render: (a) => (
        <div className="flex items-center gap-2">
          {a.hideProfile ? (
            <Badge color="gray">hidden by alumnus</Badge>
          ) : (
            <Badge color={a.approved ? 'green' : 'amber'}>{a.approved ? 'listed' : 'pending'}</Badge>
          )}
          <button type="button" onClick={(e) => toggleApproved(a, e)} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
            {a.approved ? 'Hide' : 'Approve'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageTitle
        title="Alumni"
        description="Entries in the public Alumni directory. Alumni who sign up appear here as pending until approved."
        actions={<Button onClick={() => setEditing({ approved: true })}><FaPlus /> Add alumnus</Button>}
      />

      <StatGrid cols={3}>
        <StatCard label="All entries" value={rows.length} icon={FaUserGraduate} tone="gray" loading={loading} />
        <StatCard label="Listed" value={rows.filter((a) => a.approved).length} icon={FaCheckCircle} tone="green" loading={loading} />
        <StatCard label="Pending approval" value={rows.filter((a) => !a.approved).length} icon={FaHourglassHalf} tone="amber" loading={loading} />
      </StatGrid>

      <AlumniRequests onApproved={reload} />
      <Alert type="error" className="mb-4">{error || actionError}</Alert>

      <Card className="p-0">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search name, batch, company…"
          filters={[{ key: 'approved', value: approved, onChange: setApproved, options: [{ value: 'all', label: 'All' }, { value: 'yes', label: 'Listed' }, { value: 'no', label: 'Pending' }] }]}
        />
        <DataTable columns={columns} rows={pageItems} loading={loading} onRowClick={(a) => setEditing(a)} emptyTitle="No alumni found" />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>

      {editing && (
        <CrudModal
          key={editing._id || 'new'}
          open
          size="lg"
          title={editing._id ? `Edit ${editing.name}` : 'Add alumnus'}
          fields={FIELDS}
          initial={editing}
          onSubmit={save}
          onDelete={editing._id && !editing.user ? remove : undefined}
          deleteLabel="Delete entry"
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
