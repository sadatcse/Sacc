'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaArrowLeft, FaPen, FaTrash, FaPrint, FaFilePdf, FaPlus, FaLink, FaCheck, FaCalendarAlt, FaMapMarkerAlt, FaSignature, FaFont, FaSearch, FaUsers, FaUser,
} from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import { apiSecure, apiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { EVENT_CERT_TYPE, MAX_EVENT_SIGNERS, MAX_RECIPIENTS_PER_ADD, parseRecipientLines } from '@/config/event-certificates';
import { EVENT_FIELDS } from '@/views/dashboard/EventCertificatesManager';
import PageTitle from '@/components/dashboard/PageTitle';
import DataTable from '@/components/dashboard/DataTable';
import CrudModal from '@/components/dashboard/CrudModal';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import { Input, Select, Textarea } from '@/components/forms/FormField';

const stop = (fn) => (e) => {
  e.stopPropagation();
  fn();
};

function CopyLink({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/certificates/${code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <Button size="sm" variant="ghost" onClick={copy} title="Copy the verify link">
      {copied ? <FaCheck className="text-green-600" /> : <FaLink />}
    </Button>
  );
}

// Add one person, or paste a list (one per line: Name | Institution / ID | Detail)
function AddCertificates({ eventId, types, onAdded }) {
  const [type, setType] = useState('participant');
  const [bulk, setBulk] = useState(false);
  const [one, setOne] = useState({ name: '', institution: '', email: '', detail: '' });
  const [lines, setLines] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const t = EVENT_CERT_TYPE[type];
  const parsed = useMemo(() => (bulk ? parseRecipientLines(lines) : []), [bulk, lines]);
  const set = (name) => (e) => setOne((v) => ({ ...v, [name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const recipients = bulk ? parsed : [one];
    if (!recipients.length) return setStatus({ type: 'error', message: 'Paste at least one name.' });
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiSecure.post(`/certificate-events/${eventId}/recipients`, { type, recipients });
      setStatus({ type: 'success', message: res.data.message });
      if (bulk) setLines('');
      else setOne({ name: '', institution: '', email: '', detail: '' });
      await onAdded();
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={<span className="flex items-center gap-2"><FaPlus className="text-orange-500" aria-hidden /> Add certificates</span>}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-body">Certificate for</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Certificate type">
            {types.map((x) => (
              <button
                key={x.value}
                type="button"
                role="radio"
                aria-checked={type === x.value}
                onClick={() => setType(x.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  type === x.value ? 'border-orange-500 bg-orange-500/10 font-semibold text-orange-700 dark:text-orange-300' : 'border-line/15 text-body hover:border-orange-500/50'
                )}
              >
                {x.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-subtle">Prints “{types.find((x) => x.value === type)?.title}”.</p>
        </div>

        <div className="inline-flex rounded-lg border border-line/15 p-0.5 text-sm">
          {[[false, 'One person', FaUser], [true, 'Paste a list', FaUsers]].map(([value, label, Icon]) => (
            <button key={label} type="button" onClick={() => setBulk(value)} className={cn('inline-flex items-center gap-2 rounded-md px-3 py-1.5', bulk === value ? 'bg-surface-2 font-semibold text-ink' : 'text-muted')}>
              <Icon aria-hidden /> {label}
            </button>
          ))}
        </div>

        {bulk ? (
          <div>
            <Textarea
              label="One person per line"
              name="lines"
              rows={7}
              value={lines}
              onChange={(e) => setLines(e.target.value)}
              disabled={busy}
              placeholder={`Rahim Uddin | CSE 22, ID 221000101 | ${t.detailPlaceholder.replace(/^e\.g\. /, '')}\nKarim Hasan | Daffodil International University\nNusrat Jahan`}
            />
            <p className="mt-1 text-xs text-subtle">
              Format: <span className="font-mono">Name | Institution or student ID | {t.detailLabel.replace(/ \(optional\)$/, '')}</span> — only the name is needed{t.detailRequired ? ` (${t.detailLabel.toLowerCase()} too)` : ''}. Copying columns from Excel works too.
              {parsed.length > 0 && <span className="font-semibold text-ink"> {parsed.length} name{parsed.length > 1 ? 's' : ''} found{parsed.length > MAX_RECIPIENTS_PER_ADD ? ` — max ${MAX_RECIPIENTS_PER_ADD} at a time` : ''}.</span>}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" name="name" required value={one.name} onChange={set('name')} disabled={busy} placeholder="As it should be printed" />
            <Input label="Institution / student ID (optional)" name="institution" value={one.institution} onChange={set('institution')} disabled={busy} placeholder="e.g. Software Engineer, Brain Station 23" />
            <Input label={t.detailLabel} name="detail" required={t.detailRequired} value={one.detail} onChange={set('detail')} disabled={busy} placeholder={t.detailPlaceholder} />
            <Input label="Email (optional)" name="email" type="email" value={one.email} onChange={set('email')} disabled={busy} />
          </div>
        )}

        <Alert type={status.type || 'info'}>{status.message}</Alert>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy || (bulk && !parsed.length)}>{busy ? 'Issuing…' : bulk ? `Issue ${parsed.length || ''} certificate${parsed.length === 1 ? '' : 's'}` : 'Issue certificate'}</Button>
        </div>
      </form>
    </Card>
  );
}

// Up to 3 signers: faculty from Executives (their uploaded signature is printed) or anyone typed in.
// Changes save on their own: removing / picking a person right away, typed fields when you leave the field.
const toRow = (s) => ({ executive: s.executive ? String(s.executive) : '', name: s.name || '', role: s.role || '', designation: s.designation || '' });
// A picked person's name / designation come from Executives
const toPayload = (rows) => rows.map((r) => (r.executive ? { executive: r.executive, role: r.role } : { name: r.name, role: r.role, designation: r.designation }));

function SignersEditor({ event, options, onSaved }) {
  const [rows, setRows] = useState(() => event.signers.map(toRow));
  const [saved, setSaved] = useState(() => JSON.stringify(toPayload(event.signers.map(toRow))));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const byId = Object.fromEntries(options.map((o) => [o._id, o]));
  const incomplete = rows.some((r) => !r.executive && !r.name.trim());
  const dirty = JSON.stringify(toPayload(rows)) !== saved;

  const save = async (next) => {
    const payload = toPayload(next);
    if (next.some((r) => !r.executive && !r.name.trim()) || JSON.stringify(payload) === saved) return;
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      await apiSecure.patch(`/certificate-events/${event._id}`, { signers: payload });
      setSaved(JSON.stringify(payload));
      setStatus({ type: 'success', message: `Saved — certificates are now signed by ${next.length ? `${next.length} ${next.length === 1 ? 'person' : 'people'}` : 'nobody'}.` });
      await onSaved();
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err) });
    } finally {
      setBusy(false);
    }
  };

  // Change rows and save straight away
  const commit = (next) => {
    setRows(next);
    save(next);
  };
  const update = (i, patch) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const pick = (i, id) => {
    const person = byId[id];
    commit(rows.map((row, j) => (j === i ? (person ? { executive: id, name: person.name, role: row.role || person.role, designation: person.designation } : { executive: '', name: '', role: row.role, designation: '' }) : row)));
  };
  const onBlur = () => save(rows);

  return (
    <Card title={<span className="flex items-center gap-2"><FaSignature className="text-orange-500" aria-hidden /> Signed by</span>}>
      {!rows.length && <p className="mb-3 text-sm text-subtle">No signers — the certificates print without signatures.</p>}
      <ul className="space-y-3">
        {rows.map((row, i) => (
          <li key={i} className="rounded-lg border border-line/10 bg-canvas-2 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label={`Signer ${i + 1}`}
                name={`signer-${i}`}
                value={row.executive}
                onChange={(e) => pick(i, e.target.value)}
                disabled={busy}
                options={[{ value: '', label: 'Someone else (type the name)' }, ...options.map((o) => ({ value: o._id, label: `${o.name}${o.hasSignature ? ' ✓ signature' : ''}` }))]}
              />
              <Input label="Role on the certificate" name={`role-${i}`} value={row.role} onChange={(e) => update(i, { role: e.target.value })} onBlur={onBlur} disabled={busy} placeholder="e.g. Chief Advisor, Convener" />
              {!row.executive && (
                <>
                  <Input label="Name" name={`name-${i}`} required value={row.name} onChange={(e) => update(i, { name: e.target.value })} onBlur={onBlur} disabled={busy} />
                  <Input label="Designation" name={`designation-${i}`} value={row.designation} onChange={(e) => update(i, { designation: e.target.value })} onBlur={onBlur} disabled={busy} placeholder="e.g. Head, Department of CSE" />
                </>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-subtle">
              <span>{row.executive ? (byId[row.executive]?.hasSignature ? 'Signature image is printed.' : 'No signature uploaded — the line stays blank to sign by hand (upload in Dashboard → Certificates).') : 'Signs by hand on the printed copy.'}</span>
              <Button size="sm" variant="ghost" onClick={() => commit(rows.filter((_, j) => j !== i))} disabled={busy}><FaTrash /> Remove</Button>
            </div>
          </li>
        ))}
      </ul>
      {dirty && incomplete && <Alert type="warning" className="mt-3">Type the new signer’s name — it saves when you leave the field.</Alert>}
      <Alert type={status.type || 'info'} className="mt-3">{status.message}</Alert>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" size="sm" onClick={() => setRows((r) => [...r, { executive: '', name: '', role: '', designation: '' }])} disabled={busy || rows.length >= MAX_EVENT_SIGNERS}>
          <FaPlus /> Add signer
        </Button>
        <span className="text-xs text-subtle">{busy ? 'Saving…' : dirty ? 'Not saved yet' : 'All changes saved'}</span>
      </div>
    </Card>
  );
}

// Title + text per certificate type for this event
function WordingModal({ event, types, onSaved, onClose }) {
  const [type, setType] = useState(types[0].value);
  const [wording, setWording] = useState(() => ({ ...(event.wording || {}) }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const base = EVENT_CERT_TYPE[type];
  const current = { title: wording[type]?.title ?? '', body: wording[type]?.body ?? '' };
  const set = (field) => (e) => setWording((w) => ({ ...w, [type]: { ...current, [field]: e.target.value } }));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await apiSecure.patch(`/certificate-events/${event._id}`, { wording });
      await onSaved();
      onClose();
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="lg"
      title="Certificate wording"
      onClose={busy ? undefined : onClose}
      footer={
        <>
          <Button variant="ghost" className="mr-auto" onClick={() => setWording((w) => ({ ...w, [type]: { title: '', body: '' } }))} disabled={busy}>Use default for {base.label}</Button>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save wording'}</Button>
        </>
      }
    >
      <Alert type="error" className="mb-3">{error}</Alert>
      <div className="space-y-4">
        <Select label="Certificate type" name="type" value={type} onChange={(e) => setType(e.target.value)} options={types.map((t) => ({ value: t.value, label: `${t.label}${wording[t.value]?.title || wording[t.value]?.body ? ' (custom)' : ''}` }))} />
        <Input label="Title" name="title" value={current.title} onChange={set('title')} placeholder={base.title} disabled={busy} />
        <Textarea label="Text after the name" name="body" rows={4} value={current.body} onChange={set('body')} placeholder={base.body} disabled={busy} />
        <p className="text-xs text-subtle">
          Leave empty to use the default shown in grey. Placeholders: <span className="font-mono">{'{event} {date} {venue} {detail} {name} {institution} {club}'}</span>. Keep it to about 3 lines.
        </p>
      </div>
    </Modal>
  );
}

const CERT_FIELDS = (values) => {
  const t = EVENT_CERT_TYPE[values.type] || EVENT_CERT_TYPE.participant;
  return [
    { name: 'name', label: 'Full name', required: true, full: true },
    { name: 'type', label: 'Certificate for', type: 'select', options: Object.values(EVENT_CERT_TYPE).map((x) => ({ value: x.value, label: x.label })) },
    { name: 'detail', label: t.detailLabel, required: t.detailRequired, placeholder: t.detailPlaceholder },
    { name: 'institution', label: 'Institution / student ID' },
    { name: 'email', label: 'Email', type: 'email' },
  ];
};

export default function EventCertificateBoard({ id }) {
  const router = useRouter();
  const board = useApi(`/certificate-events/${id}`, { select: (res) => res.data });
  const data = board.data;
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [editingEvent, setEditingEvent] = useState(false);
  const [editingWording, setEditingWording] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const certificates = useMemo(() => data?.certificates || [], [data]);
  const counts = useMemo(() => certificates.reduce((acc, c) => ({ ...acc, [c.type]: (acc[c.type] || 0) + 1 }), {}), [certificates]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return certificates.filter((c) => (filter === 'all' || c.type === filter) && (!q || [c.name, c.recipient.institution, c.detail, c.code].some((f) => f?.toLowerCase().includes(q))));
  }, [certificates, filter, search]);

  const run = async (fn) => {
    setBusy(true);
    setNotice({ type: '', message: '' });
    try {
      const res = await fn();
      if (res?.data?.message) setNotice({ type: 'success', message: res.data.message });
      await board.reload();
    } catch (err) {
      setNotice({ type: 'error', message: apiError(err) });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  if (board.error) return <Alert type="error">{board.error}</Alert>;
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16" />
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-72" rounded="rounded-xl" /><Skeleton className="h-72" rounded="rounded-xl" /></div>
      </div>
    );
  }

  const { event, types } = data;
  const validCount = certificates.filter((c) => !c.revoked).length;
  const printUrl = `/api/certificate-events/${id}/pdf${filter !== 'all' ? `?type=${filter}` : ''}`;

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <div>
          <p className={cn('font-medium text-ink', c.revoked && 'line-through opacity-60')}>{c.name}</p>
          <p className="text-xs text-subtle">{c.recipient.institution || '—'}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'For',
      render: (c) => (
        <div>
          <Badge color={EVENT_CERT_TYPE[c.type]?.color}>{EVENT_CERT_TYPE[c.type]?.label}</Badge>
          {c.detail && <p className="mt-1 text-xs text-body">{c.detail}</p>}
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Certificate ID',
      render: (c) => (
        <div>
          <p className="font-mono text-xs text-body">{c.code}</p>
          {c.revoked && <Badge color="red" className="mt-1">Revoked</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {!c.revoked && (
            <Button size="sm" variant="secondary" href={c.pdfUrl} target="_blank" onClick={(e) => e.stopPropagation()}>
              <FaFilePdf /> PDF
            </Button>
          )}
          <CopyLink code={c.code} />
          <Button size="sm" variant="ghost" disabled={busy} onClick={stop(() => setEditingCert(c))} aria-label="Edit"><FaPen /></Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={stop(() =>
              c.revoked
                ? run(() => apiSecure.patch(`/event-certificates/${c._id}`, { revoked: false }))
                : setConfirm({
                    title: 'Revoke certificate?',
                    message: `${c.name}'s certificate ${c.code} will show as revoked on the verify page and its PDF stops working. You can restore it later.`,
                    label: 'Revoke',
                    run: () => run(() => apiSecure.patch(`/event-certificates/${c._id}`, { revoked: true })),
                  })
            )}
          >
            {c.revoked ? 'Restore' : 'Revoke'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            aria-label="Delete"
            onClick={stop(() =>
              setConfirm({
                title: 'Delete certificate?',
                message: `${c.code} will no longer verify. Adding ${c.name} again gives a new code.`,
                label: 'Delete',
                run: () => run(() => apiSecure.delete(`/event-certificates/${c._id}`)),
              })
            )}
          >
            <FaTrash />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Button variant="ghost" size="sm" href="/dashboard/event-certificates" className="mb-3"><FaArrowLeft /> All events</Button>
      <PageTitle
        title={event.title}
        description={
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><FaCalendarAlt aria-hidden /> {event.dateText}</span>
            {event.venue && <span className="inline-flex items-center gap-1.5"><FaMapMarkerAlt aria-hidden /> {event.venue}</span>}
            <span>{event.publicPdf ? 'Recipients can download their PDF from the verify page' : 'PDFs are for admins only'}</span>
          </span>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditingEvent(true)}><FaPen /> Edit event</Button>
            <Button variant="secondary" onClick={() => setEditingWording(true)}><FaFont /> Wording</Button>
            <Button href={validCount ? printUrl : undefined} target="_blank" disabled={!validCount} onClick={validCount ? undefined : (e) => e.preventDefault()}>
              <FaPrint /> Print {filter === 'all' ? 'all' : `${EVENT_CERT_TYPE[filter].label.toLowerCase()}s`} (PDF)
            </Button>
          </>
        }
      />

      <Alert type={notice.type || 'info'} className="mb-4">{notice.message}</Alert>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <AddCertificates eventId={id} types={types} onAdded={board.reload} />
        <SignersEditor key={event._id} event={event} options={data.signerOptions} onSaved={board.reload} />
      </div>

      <Card className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line/10 px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {[{ value: 'all', label: 'All' }, ...types].map((t) => {
              const n = t.value === 'all' ? certificates.length : counts[t.value] || 0;
              if (t.value !== 'all' && !n) return null;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFilter(t.value)}
                  className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', filter === t.value ? 'bg-primary-600 text-white' : 'bg-surface-2 text-body hover:bg-line/10')}
                >
                  {t.label} ({n})
                </button>
              );
            })}
          </div>
          <label className="relative ml-auto w-full sm:w-64">
            <span className="sr-only">Search certificates</span>
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-subtle" aria-hidden />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, institution…" className="w-full rounded-lg border border-line/20 bg-surface py-1.5 pl-8 pr-3 text-sm text-ink focus:border-primary-500 focus:outline-none" />
          </label>
        </div>
        <DataTable columns={columns} rows={rows} loading={board.loading && !certificates.length} emptyTitle="No certificates yet" emptyDescription="Add participants, winners, speakers or guests above." />
      </Card>

      <div className="mt-8 border-t border-line/10 pt-6">
        <Button
          variant="ghost"
          className="text-red-600 dark:text-red-400"
          disabled={busy}
          onClick={() =>
            setConfirm({
              title: 'Delete this event?',
              message: `The event and all ${certificates.length} certificate${certificates.length === 1 ? '' : 's'} are deleted. Their codes will no longer verify.`,
              label: 'Delete event',
              run: async () => {
                setBusy(true);
                try {
                  await apiSecure.delete(`/certificate-events/${id}`);
                  router.push('/dashboard/event-certificates');
                } catch (err) {
                  setNotice({ type: 'error', message: apiError(err) });
                  setBusy(false);
                  setConfirm(null);
                }
              },
            })
          }
        >
          <FaTrash /> Delete event
        </Button>
      </div>

      {editingEvent && (
        <CrudModal
          open
          size="lg"
          title="Edit event"
          fields={EVENT_FIELDS}
          initial={event}
          onSubmit={async (values) => {
            const { title, date, endDate, venue, organizer, issuedOn, publicPdf } = values;
            await apiSecure.patch(`/certificate-events/${id}`, { title, date, endDate, venue, organizer, issuedOn, publicPdf });
            setEditingEvent(false);
            setNotice({ type: 'success', message: 'Event saved — every certificate shows the new details.' });
            await board.reload();
          }}
          onClose={() => setEditingEvent(false)}
        />
      )}

      {editingWording && <WordingModal event={event} types={types} onSaved={board.reload} onClose={() => setEditingWording(false)} />}

      {editingCert && (
        <CrudModal
          key={editingCert._id}
          open
          title={`Edit ${editingCert.code}`}
          fields={CERT_FIELDS}
          initial={{ name: editingCert.name, type: editingCert.type, detail: editingCert.detail, institution: editingCert.recipient.institution, email: editingCert.recipient.email }}
          onSubmit={async (values) => {
            await apiSecure.patch(`/event-certificates/${editingCert._id}`, values);
            setEditingCert(null);
            await board.reload();
          }}
          onClose={() => setEditingCert(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        loading={busy}
        onConfirm={() => confirm?.run()}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
