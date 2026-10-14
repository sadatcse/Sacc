import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle, FaFilePdf, FaDownload, FaUser } from 'react-icons/fa';
import { getCertificateByCode } from '@/server/services/certificate.service';
import { formatCalendarDate } from '@/lib/utils';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import Button from '@/components/ui/Button';
import { initials } from '@/components/executives/ExecutiveCard';

// Certificate verification — the code and barcode on every certificate point here
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { code } = await params;
  const cert = await getCertificateByCode(code);
  return {
    title: cert ? `Certificate ${cert.code}` : 'Certificate not found',
    robots: { index: false },
  };
}

export default async function Page({ params }) {
  const { code } = await params;
  const cert = await getCertificateByCode(code);
  if (!cert) notFound();

  const valid = !cert.revoked;
  const r = cert.recipient;
  const facts = [
    ['Certificate ID', <span key="code" className="font-mono">{cert.code}</span>],
    ['Role', cert.role],
    ['Committee year', cert.year],
    ['Student ID', r.studentId],
    ['Batch', r.batch],
    ['Department', r.department],
    ['Issued on', cert.issuedOn && formatCalendarDate(cert.issuedOn)],
  ].filter(([, value]) => value);

  return (
    <div className="min-h-[70vh] bg-canvas text-body">
      <DarkPageHeader title="Certificate" accent="Verification" breadcrumbs={[{ label: 'Executives', href: '/executives' }, { label: cert.code }]} />

      <div className="container max-w-3xl py-12">
        <div className={`flex items-center gap-3 rounded-2xl border p-5 ${valid ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          {valid ? <FaCheckCircle className="shrink-0 text-2xl text-green-600 dark:text-green-400" aria-hidden /> : <FaTimesCircle className="shrink-0 text-2xl text-red-600 dark:text-red-400" aria-hidden />}
          <div>
            <p className="font-semibold text-ink">{valid ? 'This certificate is genuine' : 'This certificate has been revoked'}</p>
            <p className="text-sm text-muted">
              {valid ? 'It was issued by the club to a member of its executive committee.' : 'It is no longer valid. Please contact the club for details.'}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-line/10 bg-surface p-6">
          <div className="flex items-center gap-4">
            {cert.photo ? (
              <Image unoptimized src={cert.photo} alt={r.name} width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover object-top" />
            ) : (
              <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-surface-2 text-xl font-bold text-ink">{initials(r.name)}</span>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-subtle">Presented to</p>
              <h2 className="text-2xl font-bold text-ink">{r.name}</h2>
              <p className="text-orange-600 dark:text-orange-400">{cert.role} · {cert.year}</p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-subtle">{label}</dt>
                <dd className="font-medium text-ink-2">{value}</dd>
              </div>
            ))}
          </dl>

          {cert.signers?.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold text-ink">Signed by</h3>
              <ul className="mt-2 grid gap-3 sm:grid-cols-3">
                {cert.signers.map((s) => (
                  <li key={s.name} className="rounded-lg border border-line/10 bg-canvas-2 p-3 text-sm">
                    <p className="font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">{s.role}</p>
                    {s.designation && <p className="text-xs text-subtle">{s.designation}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {valid && (
              <>
                <Button href={cert.pdfUrl} target="_blank" variant="brand" prefetch={false}><FaFilePdf /> View certificate</Button>
                <Button href={`${cert.pdfUrl}?download=1`} variant="secondary" prefetch={false}><FaDownload /> Download PDF</Button>
              </>
            )}
            {cert.slug && (
              <Button href={`/executives/${cert.slug}`} variant="secondary"><FaUser /> View profile</Button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-subtle">
          Checking another certificate? <Link href="/certificates" className="underline hover:text-orange-600 dark:hover:text-orange-400">Enter its Certificate ID</Link>.
        </p>
      </div>
    </div>
  );
}
