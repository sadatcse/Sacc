'use client';
import { useMemo, useState } from 'react';
import { FaSignal, FaCalendarDay, FaHistory, FaCalendarAlt, FaCalendar, FaUsers } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import usePagination from '@/hooks/usePagination';
import { formatDate } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import BarList from '@/components/dashboard/BarList';
import DataTable from '@/components/dashboard/DataTable';
import FilterBar from '@/components/dashboard/FilterBar';
import Pagination from '@/components/dashboard/Pagination';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const SOURCE_COLORS = { Direct: 'gray', 'Search Engine': 'green', Referral: 'blue' };

const SOURCE_FILTER = [
  { value: 'all', label: 'All sources' },
  { value: 'Direct', label: 'Direct' },
  { value: 'Search Engine', label: 'Search engine' },
  { value: 'Referral', label: 'Referral' },
];

const COLUMNS = [
  { key: 'createdAt', header: 'Time', render: (r) => formatDate(r.createdAt, true), className: 'whitespace-nowrap' },
  { key: 'path', header: 'Page' },
  { key: 'source', header: 'Source', render: (r) => <Badge color={SOURCE_COLORS[r.source]}>{r.sourceName || r.source}</Badge> },
  { key: 'country', header: 'Country' },
  { key: 'ip', header: 'IP', className: 'font-mono text-xs' },
];

export default function TrafficAnalytics() {
  const { data: stats, loading, error, reload } = useApi('/visitor/stats', { select: (res) => res.stats });
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (stats?.recent || []).filter(
      (v) =>
        (source === 'all' || v.source === source) &&
        (!q || [v.path, v.country, v.ip, v.sourceName].some((field) => field?.toLowerCase().includes(q)))
    );
  }, [stats, search, source]);

  const { page, setPage, pageCount, pageItems } = usePagination(filtered, 15);

  const sources = [
    { label: 'Direct', value: stats?.sources?.direct || 0 },
    { label: 'Search engine', value: stats?.sources?.searchEngine || 0 },
    { label: 'Referral', value: stats?.sources?.referral || 0 },
  ];
  const countries = (stats?.countries || []).map((c) => ({ label: c.name || 'Unknown', value: c.count }));

  return (
    <>
      <PageTitle
        title="Traffic Analytics"
        description="Who is visiting the website and where they come from."
        actions={<Button variant="secondary" onClick={reload} disabled={loading}>Refresh</Button>}
      />

      <Alert type="error" className="mb-4">{error}</Alert>

      <StatGrid cols={6}>
        <StatCard label="Online now" value={stats?.online} icon={FaSignal} tone="green" loading={loading} />
        <StatCard label="Today" value={stats?.today} icon={FaCalendarDay} loading={loading} />
        <StatCard label="Yesterday" value={stats?.yesterday} icon={FaHistory} tone="gray" loading={loading} />
        <StatCard label="This month" value={stats?.month} icon={FaCalendarAlt} tone="amber" loading={loading} />
        <StatCard label="This year" value={stats?.year} icon={FaCalendar} tone="red" loading={loading} />
        <StatCard label="All time" value={stats?.total} icon={FaUsers} loading={loading} />
      </StatGrid>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title="Traffic sources">
          <BarList items={sources} />
        </Card>
        <Card title="Top countries">
          <BarList items={countries} />
        </Card>
      </div>

      <Card className="p-0">
        <div className="px-5 pt-5">
          <h3 className="text-base">Recent visitors</h3>
        </div>
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search page, country, IP…"
          filters={[{ key: 'source', value: source, onChange: setSource, options: SOURCE_FILTER }]}
        />
        <DataTable columns={COLUMNS} rows={pageItems} loading={loading} emptyTitle="No visitors yet" />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>
    </>
  );
}
