'use client';
import { useMemo, useState } from 'react';
import { FaPlus, FaUserGraduate, FaCheckCircle, FaHourglassHalf } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import usePagination from '@/hooks/usePagination';
import { apiSecure, apiError } from '@/lib/api-client';
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

export default function AlumniManager() {
  const { data: rows, setData: setRows, loading, error } = useApi('/alumni?all=1', { initialData: [], select: (res) => res.data || [] });
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
          <Badge color={a.approved ? 'green' : 'amber'}>{a.approved ? 'listed' : 'pending'}</Badge>
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
