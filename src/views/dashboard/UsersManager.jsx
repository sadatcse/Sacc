'use client';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaUsers, FaUserShield, FaUserGraduate, FaUserTie, FaPlus, FaCog, FaCheck, FaHourglassHalf } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import useAuth from '@/hooks/useAuth';
import usePagination from '@/hooks/usePagination';
import { apiSecure } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS } from '@/config/profiles';
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

const ROLE_COLORS = { admin: 'red', student: 'blue', alumni: 'amber' };
const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = [{ value: 'active', label: 'Active' }, { value: 'pending', label: 'Waiting for approval' }, { value: 'suspended', label: 'Suspended' }];
const STATUS_COLORS = { active: 'green', pending: 'amber', suspended: 'gray' };

const fields = (isNew) => [
  { name: 'name', label: 'Full name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'role', label: 'Role', type: 'select', options: ROLE_OPTIONS, help: 'Teachers & faculty = Admin' },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  { name: 'phone', label: 'Phone' },
  {
    name: 'password',
    label: isNew ? 'Password' : 'New password',
    type: 'password',
    required: isNew,
    minLength: 8,
    autoComplete: 'new-password',
    help: isNew ? 'At least 8 characters — share it with the user.' : 'Leave blank to keep the current password.',
  },
];

export default function UsersManager() {
  const { user: me } = useAuth();
  const { data: users, setData: setUsers, loading, error } = useApi('/users', { initialData: [], select: (res) => res.data || [] });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState(useSearchParams().get('status') || 'all');
  const [notice, setNotice] = useState('');
  const [approving, setApproving] = useState(null);
  const [editing, setEditing] = useState(null); // user object, {} for new, null closed

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (role === 'all' || u.role === role) &&
        (status === 'all' || u.status === status) &&
        (!q || [u.name, u.email, u.phone].some((f) => f?.toLowerCase().includes(q)))
    );
  }, [users, search, role, status]);
  const { page, setPage, pageCount, pageItems } = usePagination(filtered, 15);
  const count = (r) => users.filter((u) => u.role === r).length;

  const save = async (values) => {
    const { password, ...rest } = values;
    const body = { ...rest, ...(password && { password }) };
    if (editing._id) {
      const res = await apiSecure.patch(`/users/${editing._id}`, body);
      setUsers((list) => list.map((u) => (u._id === editing._id ? res.data.data.user : u)));
    } else {
      const res = await apiSecure.post('/users', body);
      setUsers((list) => [res.data.data, ...list]);
    }
    setEditing(null);
  };

  // Pending → active. The server emails the person that they can sign in now.
  const approve = async (u) => {
    setApproving(u._id);
    setNotice('');
    try {
      const res = await apiSecure.patch(`/users/${u._id}`, { status: 'active' });
      setUsers((list) => list.map((x) => (x._id === u._id ? res.data.data.user : x)));
      setNotice(`${u.name}: ${res.data.message}`);
    } catch (err) {
      setNotice(err?.response?.data?.message || 'Could not approve the account.');
    } finally {
      setApproving(null);
    }
  };
  const pendingCount = users.filter((u) => u.status === 'pending').length;

  const remove = async () => {
    await apiSecure.delete(`/users/${editing._id}`);
    setUsers((list) => list.filter((u) => u._id !== editing._id));
    setEditing(null);
  };

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div>
          <p className="font-medium text-ink">{u.name}{u._id === me?._id && <span className="ml-2 text-xs text-faint">(you)</span>}</p>
          <p className="text-xs text-subtle">{u.email}</p>
          {u.signup && (
            <p className="mt-1 text-xs text-muted">
              {[u.signup.studentId && `ID ${u.signup.studentId}`, u.signup.batch, u.signup.designation, u.signup.department].filter(Boolean).join(' · ')}
            </p>
          )}
          <p className="mt-1 flex gap-3 text-xs">
            <a href={`/dashboard/login-history?search=${encodeURIComponent(u.email)}`} onClick={(e) => e.stopPropagation()} className="text-primary-600 hover:underline dark:text-primary-400">Logins</a>
            <a href={`/dashboard/activity?user=${u._id}`} onClick={(e) => e.stopPropagation()} className="text-primary-600 hover:underline dark:text-primary-400">Activity</a>
          </p>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (u) => <Badge color={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role] || u.role}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (u) =>
        u.status === 'pending' ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="amber">waiting</Badge>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                approve(u);
              }}
              disabled={approving === u._id}
            >
              <FaCheck /> {approving === u._id ? 'Approving…' : 'Approve'}
            </Button>
          </div>
        ) : (
          <Badge color={STATUS_COLORS[u.status] || 'gray'}>{u.status}</Badge>
        ),
    },
    { key: 'createdAt', header: 'Joined', render: (u) => formatDate(u.createdAt), className: 'whitespace-nowrap' },
    { key: 'lastLoginAt', header: 'Last sign-in', render: (u) => formatDate(u.lastLoginAt, true), className: 'whitespace-nowrap' },
  ];

  return (
    <>
      <PageTitle
        title="Users"
        description="Everyone who can sign in. Teachers and faculty are admins."
        actions={
          <>
            <Button variant="secondary" href="/dashboard/settings"><FaCog /> Settings</Button>
            <Button onClick={() => setEditing({ role: 'student', status: 'active' })}><FaPlus /> Add user</Button>
          </>
        }
      />

      <StatGrid>
        <StatCard label="All users" value={users.length} icon={FaUsers} tone="gray" loading={loading} />
        <StatCard label="Admins (faculty)" value={count('admin')} icon={FaUserShield} tone="red" loading={loading} />
        <StatCard label="Students" value={count('student')} icon={FaUserGraduate} loading={loading} />
        <StatCard label="Alumni" value={count('alumni')} icon={FaUserTie} tone="amber" loading={loading} />
      </StatGrid>

      <Alert type="error" className="mb-4">{error}</Alert>
      <Alert type="success" className="mb-4">{notice}</Alert>
      {pendingCount > 0 && status !== 'pending' && (
        <button
          type="button"
          onClick={() => setStatus('pending')}
          className="mb-4 flex w-full items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-800 dark:text-amber-200"
        >
          <FaHourglassHalf aria-hidden />
          <span>
            <b>{pendingCount} account{pendingCount > 1 ? 's' : ''} waiting for approval</b> — alumni and faculty sign-ups, plus club members (approving their membership in Membership activates their login too).
          </span>
        </button>
      )}

      <Card className="p-0">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search name, email, phone…"
          filters={[
            { key: 'role', value: role, onChange: setRole, options: [{ value: 'all', label: 'All roles' }, ...ROLE_OPTIONS] },
            { key: 'status', value: status, onChange: setStatus, options: [{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS] },
          ]}
        />
        <DataTable columns={columns} rows={pageItems} loading={loading} onRowClick={(u) => setEditing(u)} emptyTitle="No users found" />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>

      {editing && (
        <CrudModal
          key={editing._id || 'new'}
          open
          title={editing._id ? `Edit ${editing.name}` : 'Add user'}
          fields={fields(!editing._id)}
          initial={{ name: '', email: '', phone: '', password: '', ...editing }}
          submitLabel={editing._id ? 'Save changes' : 'Create user'}
          onSubmit={save}
          onDelete={editing._id && editing._id !== me?._id ? remove : undefined}
          deleteLabel="Delete user"
          deleteMessage={`Delete ${editing.name}'s account? Their student/faculty profile is removed; an alumni directory entry is kept.`}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
