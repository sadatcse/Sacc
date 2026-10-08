'use client';
import { useMemo, useState } from 'react';
import { FaUsers, FaUserShield, FaUserGraduate, FaUserTie, FaPlus, FaCog } from 'react-icons/fa';
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
const STATUS_OPTIONS = [{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }];

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
  const [status, setStatus] = useState('all');
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
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (u) => <Badge color={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role] || u.role}</Badge> },
    { key: 'status', header: 'Status', render: (u) => <Badge color={u.status === 'active' ? 'green' : 'gray'}>{u.status}</Badge> },
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
