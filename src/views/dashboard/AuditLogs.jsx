'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FaSignInAlt, FaExclamationTriangle, FaUserCheck, FaDatabase, FaHistory, FaPlusCircle, FaTrashAlt, FaUsers,
  FaDesktop, FaMobileAlt, FaTabletAlt,
} from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import usePagination from '@/hooks/usePagination';
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS } from '@/config/profiles';
import PageTitle from '@/components/dashboard/PageTitle';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import DataTable from '@/components/dashboard/DataTable';
import FilterBar from '@/components/dashboard/FilterBar';
import Pagination from '@/components/dashboard/Pagination';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const ROLE_COLORS = { admin: 'red', student: 'blue', alumni: 'amber' };
const ROLE_OPTIONS = [{ value: '', label: 'All roles' }, ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))];
const DAY_OPTIONS = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '', label: 'All time (180 days kept)' },
];
const DEVICE_ICONS = { Mobile: FaMobileAlt, Tablet: FaTabletAlt, Desktop: FaDesktop };

function timeAgo(date) {
  const s = Math.round((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  const units = [[60, 'minute'], [3600, 'hour'], [86400, 'day']];
  const [secs, unit] = s < 3600 ? units[0] : s < 86400 ? units[1] : units[2];
  const n = Math.floor(s / secs);
  return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
}

// Filters → query string, with the search box debounced so typing doesn't fetch on every key
function useFilters(initial) {
  const [filters, setFilters] = useState(initial);
  const [search, setSearch] = useState(initial.search || '');
  useEffect(() => {
    const id = setTimeout(() => setFilters((f) => (f.search === search ? f : { ...f, search })), 350);
    return () => clearTimeout(id);
  }, [search]);
  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString(), [filters]);
  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));
  return { filters, set, search, setSearch, query };
}

function UserCell({ row }) {
  const label = row.name || row.email || 'Unknown';
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-ink-2">{label.charAt(0).toUpperCase()}</span>
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{label}</p>
        <p className="truncate text-xs text-subtle">
          {row.name && row.email}
          {row.role && <Badge color={ROLE_COLORS[row.role]} className="ml-1.5 align-middle !text-[10px]">{row.role}</Badge>}
          {!row.role && row.email && !row.user && <span className="ml-1 text-faint">(no account)</span>}
        </p>
      </div>
    </div>
  );
}

const whenColumn = {
  key: 'createdAt',
  header: 'When',
  className: 'whitespace-nowrap',
  render: (r) => (
    <div>
      <p className="text-ink-2">{timeAgo(r.createdAt)}</p>
      <p className="text-xs text-subtle">{formatDate(r.createdAt, true)}</p>
    </div>
  ),
};

const whereColumn = {
  key: 'where',
  header: 'Location & device',
  render: (r) => {
    const Icon = DEVICE_ICONS[r.device] || FaDesktop;
    return (
      <div className="text-xs">
        <p className="text-ink-2">{[r.city, r.country].filter(Boolean).join(', ') || 'Unknown location'} <span className="text-subtle">· {r.ip}</span></p>
        <p className="mt-0.5 flex items-center gap-1.5 text-subtle"><Icon aria-hidden /> {r.browser} · {r.os}</p>
      </div>
    );
  },
};

// ---------------- Login history ----------------

export function LoginHistory() {
  const params = useSearchParams();
  const { filters, set, search, setSearch, query } = useFilters({ result: '', role: '', days: '30', search: params.get('search') || '' });
  const { data, loading, error, reload } = useApi(`/logs/logins?${query}`, { initialData: { rows: [], stats: {} }, select: (res) => res.data });
  const { page, setPage, pageCount, pageItems } = usePagination(data.rows, 20);
  const s = data.stats || {};

  const columns = [
    { key: 'user', header: 'User', render: (r) => <UserCell row={r} /> },
    {
      key: 'success',
      header: 'Result',
      render: (r) =>
        r.success ? (
          <Badge color="green">{r.reason === 'New account' ? 'Signed up' : 'Signed in'}</Badge>
        ) : (
          <div>
            <Badge color="red">Failed</Badge>
            <p className="mt-1 text-xs text-subtle">{r.reason}</p>
          </div>
        ),
    },
    whenColumn,
    whereColumn,
  ];

  return (
    <>
      <PageTitle
        title="Login History"
        description="Every sign-in attempt on the website — successful and failed — with time, place and device."
        actions={<Button variant="secondary" onClick={reload} disabled={loading}>Refresh</Button>}
      />
      <StatGrid>
        <StatCard label="Sign-ins (24 h)" value={s.today} icon={FaSignInAlt} tone="green" loading={loading} />
        <StatCard label="Failed attempts (24 h)" value={s.failedToday} icon={FaExclamationTriangle} tone="red" loading={loading} />
        <StatCard label="Active users (7 days)" value={s.activeUsers7d} icon={FaUserCheck} loading={loading} />
        <StatCard label="All records" value={s.total} icon={FaDatabase} tone="gray" loading={loading} />
      </StatGrid>
      <Alert type="error" className="mb-4">{error}</Alert>
      <Card className="p-0">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search email, name, IP, country, browser…"
          filters={[
            { key: 'result', value: filters.result, onChange: set('result'), options: [{ value: '', label: 'All results' }, { value: 'success', label: 'Successful' }, { value: 'failed', label: 'Failed' }] },
            { key: 'role', value: filters.role, onChange: set('role'), options: ROLE_OPTIONS },
            { key: 'days', value: filters.days, onChange: set('days'), options: DAY_OPTIONS },
          ]}
        />
        <DataTable columns={columns} rows={pageItems} loading={loading} emptyTitle="No sign-ins found" emptyDescription="Try a longer time period or clear the filters." />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>
    </>
  );
}

// ---------------- User activity ----------------

const ACTION_STYLE = {
  create: ['green', 'Created'],
  update: ['blue', 'Updated'],
  delete: ['red', 'Deleted'],
  register: ['amber', 'Signed up'],
  logout: ['gray', 'Signed out'],
  password_change: ['amber', 'Password'],
};
const ACTION_OPTIONS = [{ value: '', label: 'All actions' }, ...Object.entries(ACTION_STYLE).map(([value, [, label]]) => ({ value, label }))];
const ENTITY_OPTIONS = [
  '', 'News post', 'Gallery photo', 'Executive', 'Committee position', 'Alumni entry', 'Alumni request', 'User', 'Membership application',
  'Contact message', 'Own profile', 'About page', 'Site settings', 'Registration settings', 'Email settings', 'Account', 'Password', 'Session',
].map((value) => ({ value, label: value || 'Everything' }));

export function UserActivity() {
  const params = useSearchParams();
  const { filters, set, search, setSearch, query } = useFilters({
    action: '', entity: '', role: '', days: '30', search: params.get('search') || '', user: params.get('user') || '',
  });
  const { data, loading, error, reload } = useApi(`/logs/activity?${query}`, { initialData: { rows: [], stats: {} }, select: (res) => res.data });
  const { page, setPage, pageCount, pageItems } = usePagination(data.rows, 20);
  const s = data.stats || {};
  const last30 = s.last30d || {};

  const columns = [
    { key: 'user', header: 'User', render: (r) => <UserCell row={r} /> },
    {
      key: 'summary',
      header: 'What happened',
      render: (r) => {
        const [color, label] = ACTION_STYLE[r.action] || ['gray', r.action];
        return (
          <div className="flex items-start gap-2">
            <Badge color={color} className="shrink-0">{label}</Badge>
            <span className="text-ink-2">{r.summary}</span>
          </div>
        );
      },
    },
    whenColumn,
    whereColumn,
  ];

  return (
    <>
      <PageTitle
        title="User Activity"
        description="Every change made by signed-in users — admins, students and alumni — across the website and dashboard."
        actions={
          <>
            {filters.user && <Button variant="secondary" onClick={() => set('user')('')}>Show all users</Button>}
            <Button variant="secondary" onClick={reload} disabled={loading}>Refresh</Button>
          </>
        }
      />
      <StatGrid>
        <StatCard label="Actions (24 h)" value={s.today} icon={FaHistory} loading={loading} />
        <StatCard label="Active users (7 days)" value={s.activeUsers7d} icon={FaUsers} tone="green" loading={loading} />
        <StatCard label="Created (30 days)" value={last30.create || 0} icon={FaPlusCircle} tone="amber" loading={loading} />
        <StatCard label="Deleted (30 days)" value={last30.delete || 0} icon={FaTrashAlt} tone="red" loading={loading} />
      </StatGrid>
      <Alert type="error" className="mb-4">{error}</Alert>
      {filters.user && <Alert type="info" className="mb-4">Showing one user’s activity.</Alert>}
      <Card className="p-0">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search user, email, IP or description…"
          filters={[
            { key: 'action', value: filters.action, onChange: set('action'), options: ACTION_OPTIONS },
            { key: 'entity', value: filters.entity, onChange: set('entity'), options: ENTITY_OPTIONS },
            { key: 'role', value: filters.role, onChange: set('role'), options: ROLE_OPTIONS },
            { key: 'days', value: filters.days, onChange: set('days'), options: DAY_OPTIONS },
          ]}
        />
        <DataTable columns={columns} rows={pageItems} loading={loading} emptyTitle="No activity found" emptyDescription="Changes appear here as soon as someone makes them." />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>
    </>
  );
}
