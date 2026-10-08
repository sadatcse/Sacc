'use client';
import { useMemo, useState } from 'react';
import { FaInbox, FaEnvelope, FaEnvelopeOpen, FaReply } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import usePagination from '@/hooks/usePagination';
import { apiSecure } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import DataTable from '@/components/dashboard/DataTable';
import FilterBar from '@/components/dashboard/FilterBar';
import Pagination from '@/components/dashboard/Pagination';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Alert from '@/components/ui/Alert';

const STATUS_COLORS = { unread: 'amber', read: 'blue', replied: 'green' };

const STATUS_FILTER = [
  { value: 'all', label: 'All statuses' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
];

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 text-sm">
      <dt className="text-subtle">{label}</dt>
      <dd className="col-span-2 break-words text-ink">{children || '—'}</dd>
    </div>
  );
}

export default function ContactMessages() {
  const { data: messages, setData: setMessages, loading, error, reload } = useApi('/contact', {
    initialData: [],
    select: (res) => res.data || [],
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return messages.filter(
      (m) =>
        (status === 'all' || m.status === status) &&
        (!q || [m.fullName, m.email, m.phone, m.subject, m.message].some((f) => f?.toLowerCase().includes(q)))
    );
  }, [messages, search, status]);

  const { page, setPage, pageCount, pageItems } = usePagination(filtered, 10);
  const count = (s) => messages.filter((m) => m.status === s).length;

  const replaceMessage = (updated) => setMessages((list) => list.map((m) => (m._id === updated._id ? updated : m)));

  const updateStatus = async (message, newStatus) => {
    setActionError('');
    try {
      const res = await apiSecure.patch(`/contact/${message._id}`, { status: newStatus });
      replaceMessage(res.data.data);
      setSelected(res.data.data);
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Could not update status.');
    }
  };

  const openMessage = (message) => {
    setActionError('');
    setSelected(message);
    if (message.status === 'unread') updateStatus(message, 'read');
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await apiSecure.delete(`/contact/${toDelete._id}`);
      setMessages((list) => list.filter((m) => m._id !== toDelete._id));
      setSelected(null);
      setToDelete(null);
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Could not delete message.');
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'fullName',
      header: 'From',
      render: (r) => (
        <div>
          <p className={r.status === 'unread' ? 'font-semibold text-ink' : ''}>{r.fullName}</p>
          <p className="text-xs text-subtle">{r.email}</p>
        </div>
      ),
    },
    { key: 'subject', header: 'Subject', render: (r) => <span className="line-clamp-1">{r.subject || r.message}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge color={STATUS_COLORS[r.status]}>{r.status}</Badge> },
    { key: 'createdAt', header: 'Received', render: (r) => formatDate(r.createdAt, true), className: 'whitespace-nowrap' },
  ];

  return (
    <>
      <PageTitle
        title="Contact Messages"
        description="Messages sent from the Contact page."
        actions={<Button variant="secondary" onClick={reload} disabled={loading}>Refresh</Button>}
      />

      <StatGrid>
        <StatCard label="Total" value={messages.length} icon={FaInbox} tone="gray" loading={loading} />
        <StatCard label="Unread" value={count('unread')} icon={FaEnvelope} tone="amber" loading={loading} />
        <StatCard label="Read" value={count('read')} icon={FaEnvelopeOpen} loading={loading} />
        <StatCard label="Replied" value={count('replied')} icon={FaReply} tone="green" loading={loading} />
      </StatGrid>

      <Alert type="error" className="mb-4">{error || (!selected && actionError)}</Alert>

      <Card className="p-0">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search name, email, message…"
          filters={[{ key: 'status', value: status, onChange: setStatus, options: STATUS_FILTER }]}
        />
        <DataTable columns={columns} rows={pageItems} loading={loading} onRowClick={openMessage} emptyTitle="No messages" />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.subject || 'Message'}
        footer={
          selected && (
            <>
              <Button variant="danger" onClick={() => setToDelete(selected)}>Delete</Button>
              {selected.status !== 'replied' && (
                <Button variant="secondary" onClick={() => updateStatus(selected, 'replied')}>Mark as replied</Button>
              )}
              {selected.email && (
                <Button href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || 'Your message')}`}>Reply by email</Button>
              )}
            </>
          )
        }
      >
        {selected && (
          <>
            <Alert type="error" className="mb-3">{actionError}</Alert>
            <dl className="divide-y divide-line/5">
              <DetailRow label="Name">{selected.fullName}</DetailRow>
              <DetailRow label="Email">{selected.email}</DetailRow>
              <DetailRow label="Phone">{selected.phone}</DetailRow>
              <DetailRow label="Status"><Badge color={STATUS_COLORS[selected.status]}>{selected.status}</Badge></DetailRow>
              <DetailRow label="Received">{formatDate(selected.createdAt, true)}</DetailRow>
            </dl>
            <p className="mt-4 whitespace-pre-wrap rounded-lg bg-canvas p-4 text-sm text-body">{selected.message}</p>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete message?"
        message={`This permanently deletes the message from ${toDelete?.fullName || 'this sender'}.`}
        confirmLabel="Delete"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
