'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaAward, FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaExternalLinkAlt } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import { apiSecure } from '@/lib/api-client';
import { formatCalendarDate } from '@/lib/utils';
import { EVENT_CERT_TYPES } from '@/config/event-certificates';
import PageTitle from '@/components/dashboard/PageTitle';
import CrudModal from '@/components/dashboard/CrudModal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';

// Event details — shared with the edit dialog on the event page
export const EVENT_FIELDS = [
  { name: 'title', label: 'Event name', required: true, full: true, placeholder: 'e.g. Intra-Department Programming Contest 2026' },
  { name: 'date', label: 'Event date', type: 'date', required: true },
  { name: 'endDate', label: 'End date (multi-day events)', type: 'date' },
  { name: 'venue', label: 'Venue', placeholder: 'e.g. Prof. M A Matin Building, Room 2103' },
  { name: 'issuedOn', label: 'Issue date on the certificates', type: 'date', help: 'Empty = the event date.' },
  { name: 'organizer', label: 'Line under the club name (optional)', full: true, placeholder: 'e.g. In association with the Department of CSE, University of South Asia', help: 'Empty = the line from Certificates → Edit wording.' },
  { name: 'publicPdf', label: 'Recipients can view & download their PDF from the verify page (QR code)', type: 'checkbox', full: true },
];

const dateText = (e) => (e.endDate ? `${formatCalendarDate(e.date)} – ${formatCalendarDate(e.endDate)}` : formatCalendarDate(e.date));

// Dashboard → Event Certificates: every event that gives certificates (contests, seminars, workshops…)
export default function EventCertificatesManager() {
  const router = useRouter();
  const { data, loading, error } = useApi('/certificate-events', { select: (res) => res.data });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const events = data?.events;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (events || []).filter((e) => !q || [e.title, e.venue, e.date].some((f) => f?.toLowerCase().includes(q)));
  }, [events, search]);
  const total = (events || []).reduce((n, e) => n + e.total, 0);

  const create = async (values) => {
    const res = await apiSecure.post('/certificate-events', values);
    router.push(`/dashboard/event-certificates/${res.data.data._id}`);
  };

  return (
    <>
      <PageTitle
        title="Event Certificates"
        description="Certificates for programming contests, seminars, workshops and other events — participants, winners, speakers, guests, judges, volunteers and organizers."
        actions={
          <>
            <Button variant="secondary" href="/certificates" target="_blank"><FaExternalLinkAlt /> Verify page</Button>
            <Button onClick={() => setCreating(true)} disabled={loading}><FaPlus /> New event</Button>
          </>
        }
      />

      <Alert type="error" className="mb-4">{error}</Alert>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" rounded="rounded-xl" />)}</div>
      ) : !events?.length ? (
        <EmptyState
          icon={FaAward}
          title="No events yet"
          description="Create an event, then add its participants, winners, speakers and guests — each gets a certificate with its own QR code."
          action={<Button onClick={() => setCreating(true)}><FaPlus /> New event</Button>}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="relative min-w-0 flex-1 sm:max-w-sm">
              <span className="sr-only">Search events</span>
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-subtle" aria-hidden />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events…" className="w-full rounded-lg border border-line/20 bg-surface py-2 pl-8 pr-3 text-sm text-ink focus:border-primary-500 focus:outline-none" />
            </label>
            <p className="text-sm text-muted">{events.length} event{events.length === 1 ? '' : 's'} · {total} certificate{total === 1 ? '' : 's'}</p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((e) => (
              <li key={e._id}>
                <Link href={`/dashboard/event-certificates/${e._id}`} className="group flex h-full flex-col rounded-xl border border-line/10 bg-surface p-5 shadow-sm transition-colors hover:border-orange-500/60">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400"><FaAward aria-hidden /></span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink group-hover:text-orange-600 dark:group-hover:text-orange-400">{e.title}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-subtle"><FaCalendarAlt aria-hidden /> {dateText(e)}</p>
                      {e.venue && <p className="mt-0.5 flex items-center gap-1.5 text-xs text-subtle"><FaMapMarkerAlt aria-hidden /> <span className="truncate">{e.venue}</span></p>}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {e.total ? (
                      EVENT_CERT_TYPES.filter((t) => e.counts[t.value]).map((t) => <Badge key={t.value} color={t.color}>{e.counts[t.value]} {t.label}{e.counts[t.value] > 1 ? 's' : ''}</Badge>)
                    ) : (
                      <span className="text-xs text-subtle">No certificates yet</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {!filtered.length && <p className="py-8 text-center text-sm text-subtle">No events match “{search}”.</p>}
        </>
      )}

      {creating && (
        <CrudModal
          open
          size="lg"
          title="New event"
          fields={EVENT_FIELDS}
          initial={{ date: data?.today || '', publicPdf: true }}
          submitLabel="Create event"
          onSubmit={create}
          onClose={() => setCreating(false)}
        />
      )}
    </>
  );
}
