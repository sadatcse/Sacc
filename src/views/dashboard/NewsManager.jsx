'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaNewspaper, FaCalendarAlt, FaEyeSlash, FaStar } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import usePagination from '@/hooks/usePagination';
import { categoryLabel, newsCategories, UPCOMING } from '@/data/news-categories';
import { formatCalendarDate } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import DataTable from '@/components/dashboard/DataTable';
import FilterBar from '@/components/dashboard/FilterBar';
import Pagination from '@/components/dashboard/Pagination';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const CATEGORY_OPTIONS = [{ value: 'all', label: 'All categories' }, ...newsCategories.filter((c) => c.key !== UPCOMING).map((c) => ({ value: c.key, label: c.label }))];

export default function NewsManager() {
  const router = useRouter();
  const { data: posts, loading, error } = useApi('/news?all=1', { initialData: [], select: (res) => res.data || [] });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return posts.filter(
      (p) =>
        (status === 'all' || p.status === status) &&
        (type === 'all' || p.type === type) &&
        (category === 'all' || p.category === category) &&
        (!q || [p.title, p.slug, p.excerpt, ...(p.tags || [])].some((f) => f?.toLowerCase().includes(q)))
    );
  }, [posts, search, status, type, category]);
  const { page, setPage, pageCount, pageItems } = usePagination(filtered, 15);

  const columns = [
    {
      key: 'title',
      header: 'Post',
      render: (p) => (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail of any URL */}
          <img src={p.cover} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />
          <div className="min-w-0">
            <p className="line-clamp-1 font-medium text-ink">
              {p.featured && <FaStar className="mr-1 inline text-amber-500" aria-label="Featured" />}
              {p.title}
            </p>
            <p className="truncate text-xs text-subtle">/news/{p.slug}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => categoryLabel(p.category), className: 'whitespace-nowrap' },
    { key: 'type', header: 'Type', render: (p) => <Badge color={p.type === 'event' ? 'amber' : 'blue'}>{p.type}</Badge> },
    { key: 'date', header: 'Date', render: (p) => formatCalendarDate(p.date, { day: 'numeric', month: 'short', year: 'numeric' }), className: 'whitespace-nowrap' },
    { key: 'status', header: 'Status', render: (p) => <Badge color={p.status === 'published' ? 'green' : 'gray'}>{p.status}</Badge> },
  ];

  return (
    <>
      <PageTitle
        title="News & Events"
        description="Everything on the public /news page."
        actions={<Button href="/dashboard/news/new"><FaPlus /> New post</Button>}
      />

      <StatGrid>
        <StatCard label="All posts" value={posts.length} icon={FaNewspaper} tone="gray" loading={loading} />
        <StatCard label="Events" value={posts.filter((p) => p.type === 'event').length} icon={FaCalendarAlt} tone="amber" loading={loading} />
        <StatCard label="Featured" value={posts.filter((p) => p.featured).length} icon={FaStar} tone="green" loading={loading} />
        <StatCard label="Drafts" value={posts.filter((p) => p.status === 'draft').length} icon={FaEyeSlash} loading={loading} />
      </StatGrid>

      <Alert type="error" className="mb-4">{error}</Alert>

      <Card className="p-0">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search title, slug, tag…"
          filters={[
            { key: 'category', value: category, onChange: setCategory, options: CATEGORY_OPTIONS },
            { key: 'type', value: type, onChange: setType, options: [{ value: 'all', label: 'All types' }, { value: 'article', label: 'Articles' }, { value: 'event', label: 'Events' }] },
            { key: 'status', value: status, onChange: setStatus, options: [{ value: 'all', label: 'All statuses' }, { value: 'published', label: 'Published' }, { value: 'draft', label: 'Drafts' }] },
          ]}
        />
        <DataTable columns={columns} rows={pageItems} loading={loading} onRowClick={(p) => router.push(`/dashboard/news/${p._id}`)} emptyTitle="No posts found" />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>
    </>
  );
}
