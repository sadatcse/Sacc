'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { FaCertificate, FaFilePdf, FaSyncAlt, FaPen, FaUpload, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import { apiError, apiSecure } from '@/lib/api-client';
import PageTitle from '@/components/dashboard/PageTitle';
import DataTable from '@/components/dashboard/DataTable';
import CrudModal from '@/components/dashboard/CrudModal';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';

const WORDING_FIELDS = [
  { name: 'title', label: 'Title', required: true, placeholder: 'Certificate of Appreciation', full: true },
  { name: 'organization', label: 'Club name (top line)', full: true },
  { name: 'subtitle', label: 'Line under the club name', full: true },
  { name: 'intro', label: 'Text before the name', placeholder: 'This certificate is proudly presented to', full: true },
  {
    name: 'body',
    label: 'Main text (after the name)',
    type: 'textarea',
    rows: 4,
    required: true,
    help: 'Placeholders: {role} {year} {club} {name} {batch} {department} {studentId}. Keep it to about 3 lines.',
  },
];

const stop = (fn) => (e) => {
  e.stopPropagation();
  fn();
};

// One faculty advisor who signs this year's certificates, with their signature image
function SignerCard({ signer, onChanged, onError }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await onChanged();
    } catch (err) {
      onError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const upload = (file) => {
    if (!file) return;
    const form = new FormData();
    form.append('signature', file);
    run(() => apiSecure.put(`/executives/${signer.executive}/signature`, form));
  };

  return (
    <div className="flex flex-col rounded-xl border border-line/10 bg-canvas-2 p-4">
      {/* White like the certificate paper, in both themes */}
      <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-line/20 bg-white">
        {signer.hasSignature ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/executives/${signer.executive}/signature?v=${signer.signatureVersion}`} alt={`${signer.name}'s signature`} className="max-h-16 max-w-[90%] object-contain" />
        ) : (
          <span className="px-3 text-center text-xs text-neutral-500">No signature yet — the line stays blank to sign by hand</span>
        )}
      </div>
      <p className="mt-3 font-semibold text-ink">{signer.name}</p>
      <p className="text-sm text-orange-600 dark:text-orange-400">{signer.role}</p>
      <p className="text-xs text-subtle">{[signer.designation, signer.department].filter(Boolean).join(', ')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input ref={input} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
          <FaUpload /> {signer.hasSignature ? 'Change' : 'Upload signature'}
        </Button>
        {signer.hasSignature && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => apiSecure.delete(`/executives/${signer.executive}/signature`))}>
            <FaTrash /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CertificatesManager() {
  const [year, setYear] = useState(null);
  const board = useApi(`/certificates${year ? `?year=${year}` : ''}`, { select: (res) => res.data });
  const data = board.data;
  const [issuedOn, setIssuedOn] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editingWording, setEditingWording] = useState(false);
  const [confirm, setConfirm] = useState(null); // { title, message, label, run }

  const date = issuedOn || data?.today || '';
  const executives = data?.executives || [];
  const signers = data?.signers || [];
  const issuedCount = executives.filter((e) => e.certificate).length;

  const run = async (fn) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fn();
      if (res?.data?.message) setNotice(res.data.message);
      await board.reload();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const issue = (body) => run(() => apiSecure.post('/certificates', { year: data.year, issuedOn: date, ...body }));

  const saveWording = async (values) => {
    await apiSecure.put('/settings/certificate', values);
    setEditingWording(false);
    setNotice('Certificate wording saved. Every PDF uses the new text.');
    await board.reload();
  };

  const columns = [
    {
      key: 'name',
      header: 'Student executive',
      render: (e) => (
        <div>
          <p className="font-medium text-ink">{e.name}</p>
          <p className="text-xs text-subtle">{[e.studentId && `ID ${e.studentId}`, e.batch].filter(Boolean).join(' · ') || '—'}</p>
        </div>
      ),
    },
    { key: 'role', header: 'Role' },
    {
      key: 'certificate',
      header: 'Certificate',
      render: (e) =>
        !e.certificate ? (
          <Badge color="amber">Not issued</Badge>
        ) : (
          <div>
            <Badge color={e.certificate.revoked ? 'red' : 'green'}>{e.certificate.revoked ? 'Revoked' : 'Issued'}</Badge>
            <p className="mt-1 font-mono text-xs text-subtle">{e.certificate.code}</p>
          </div>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (e) => {
        const c = e.certificate;
        if (!c) {
          return (
            <Button size="sm" disabled={busy || !signers.length} onClick={stop(() => issue({ executives: [e._id] }))}>
              <FaCertificate /> Issue
            </Button>
          );
        }
        return (
          <div className="flex flex-wrap gap-2">
            {!c.revoked && (
              <Button size="sm" variant="secondary" href={c.pdfUrl} target="_blank" onClick={(ev) => ev.stopPropagation()}>
                <FaFilePdf /> PDF
              </Button>
            )}
            <Button size="sm" variant="ghost" disabled={busy} title="Copy the latest name, role, signers and issue date into this certificate" onClick={stop(() => issue({ executives: [e._id], refresh: true }))}>
              <FaSyncAlt /> Update
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={stop(() =>
                c.revoked
                  ? run(() => apiSecure.patch(`/certificates/${c._id}`, { revoked: false }))
                  : setConfirm({
                      title: 'Revoke certificate?',
                      message: `${e.name}'s certificate ${c.code} will show as revoked on the verify page and the PDF will stop working. You can restore it later.`,
                      label: 'Revoke',
                      run: () => run(() => apiSecure.patch(`/certificates/${c._id}`, { revoked: true })),
                    })
              )}
            >
              {c.revoked ? 'Restore' : 'Revoke'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={stop(() =>
                setConfirm({
                  title: 'Delete certificate?',
                  message: `${c.code} will no longer verify. Issuing again gives ${e.name} a new code.`,
                  label: 'Delete',
                  run: () => run(() => apiSecure.delete(`/certificates/${c._id}`)),
                })
              )}
            >
              <FaTrash />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageTitle
        title="Certificates"
        description="Certificates for each year's student executives, signed by that year's top 3 faculty advisors."
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditingWording(true)} disabled={!data}><FaPen /> Edit wording</Button>
            <Button onClick={() => issue({})} disabled={!data || busy || !signers.length || issuedCount === executives.length}>
              <FaCertificate /> Issue all{executives.length > issuedCount ? ` (${executives.length - issuedCount})` : ''}
            </Button>
          </>
        }
      />

      <Alert type="error" className="mb-4">{board.error || error}</Alert>
      <Alert type="success" className="mb-4">{notice}</Alert>

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-body">Committee year</span>
            <select
              value={data?.year || ''}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm"
              disabled={!data}
            >
              {(data?.years?.length ? data.years : data ? [data.year] : []).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-body">Issue date</span>
            <input type="date" value={date} onChange={(e) => setIssuedOn(e.target.value)} className="rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm" />
          </label>
          <p className="pb-2 text-sm text-muted">
            {data ? `${issuedCount} of ${executives.length} issued` : ''}
          </p>
          {issuedCount > 0 && (
            <Button
              variant="ghost"
              className="ml-auto"
              disabled={busy || !signers.length}
              title="Copy the latest names, roles, signers and the issue date into every issued certificate (codes stay the same)"
              onClick={() => issue({ executives: executives.filter((e) => e.certificate).map((e) => e._id), refresh: true })}
            >
              <FaSyncAlt /> Update all issued
            </Button>
          )}
        </div>
      </Card>

      <Card
        className="mb-6"
        title={`Signed by — Faculty Advisors ${data?.year || ''}`}
        action={
          <Link href="/dashboard/executives" className="flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400">
            Manage committee <FaExternalLinkAlt className="text-[10px]" />
          </Link>
        }
      >
        {!data ? (
          <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" rounded="rounded-xl" />)}</div>
        ) : !signers.length ? (
          <Alert type="warning">
            No faculty advisors in the {data.year} committee. Add them in Dashboard → Executives (type “Faculty Advisor”) — the top 3 by display order sign the certificates.
          </Alert>
        ) : (
          <>
            {signers.length < 3 && (
              <Alert type="info" className="mb-4">
                Only {signers.length} faculty advisor{signers.length === 1 ? '' : 's'} in the {data.year} committee, so the certificate is signed by {signers.length === 1 ? 'one person' : 'both'}.
              </Alert>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {signers.map((s) => (
                <SignerCard key={String(s.executive)} signer={s} onChanged={board.reload} onError={setError} />
              ))}
            </div>
            <p className="mt-3 text-xs text-subtle">
              The top 3 advisors by display order sign. Signature images are used on every certificate they sign (best: PNG with a transparent background, ≤ 1 MB).
              After changing advisors, use “Update” so issued certificates list the new signers.
            </p>
          </>
        )}
      </Card>

      <Card className="p-0" title={<span className="block px-5 pt-5">Student Executives {data?.year || ''} ({executives.length})</span>}>
        <DataTable
          columns={columns}
          rows={executives}
          loading={board.loading}
          emptyTitle="No student executives in this committee"
          emptyDescription="Add them in Dashboard → Executives first."
        />
      </Card>

      {editingWording && data && (
        <CrudModal
          key="certificate-wording"
          open
          size="lg"
          title="Certificate wording"
          fields={WORDING_FIELDS}
          initial={data.template}
          onSubmit={saveWording}
          onClose={() => setEditingWording(false)}
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
