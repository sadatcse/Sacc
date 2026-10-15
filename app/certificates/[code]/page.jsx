import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle, FaFilePdf, FaSearch } from 'react-icons/fa';
import { verifyCertificate } from '@/server/services/event-certificate.service';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import { initials } from '@/components/executives/ExecutiveCard';

// Universal certificate verification (public) — the QR code on every certificate opens this page:
// executive committee certificates and event certificates (participants, winners, speakers, guests…).
// Executive certificate PDFs are private (admins and the holder); event PDFs are offered here when the event allows it.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { code } = await params;
  const cert = await verifyCertificate(code);
  return {
    title: cert ? `Certificate ${cert.code}` : 'Certificate not found',
    robots: { index: false },
  };
}

export default async function Page({ params }) {
  const { code } = await params;
  const cert = await verifyCertificate(code);
  if (!cert) notFound();

  const valid = !cert.revoked;
  const facts = [['Certificate ID', <span key="code" className="font-mono">{cert.code}</span>], ...cert.facts];

  return (
    <div className="min-h-[70vh] bg-canvas text-body">
      <DarkPageHeader title="Certificate" accent="Verification" breadcrumbs={[{ label: 'Verify Certificate', href: '/certificates' }, { label: cert.code }]} />

      <div className="container max-w-3xl py-12">
        <div className={`flex items-center gap-3 rounded-2xl border p-5 ${valid ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          {valid ? <FaCheckCircle className="shrink-0 text-2xl text-green-600 dark:text-green-400" aria-hidden /> : <FaTimesCircle className="shrink-0 text-2xl text-red-600 dark:text-red-400" aria-hidden />}
          <div>
            <p className="font-semibold text-ink">{valid ? 'This certificate is genuine' : 'This certificate has been revoked'}</p>
            <p className="text-sm text-muted">{valid ? cert.about : 'It is no longer valid. Please contact the club for details.'}</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-line/10 bg-surface">
          <div className="h-1.5 bg-gradient-to-r from-red-600 to-orange-500" aria-hidden />
          <div className="p-6">
            <div className="flex items-center gap-4">
              {cert.photo ? (
                <Image unoptimized src={cert.photo} alt={cert.name} width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover object-top" />
              ) : (
                <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xl font-bold text-orange-600 dark:text-orange-400">{initials(cert.name)}</span>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-subtle">{cert.title} · presented to</p>
                <h2 className="text-2xl font-bold text-ink">{cert.name}</h2>
                <p className="text-orange-600 dark:text-orange-400">{cert.headline}</p>
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
                      {s.role && <p className="text-xs text-orange-600 dark:text-orange-400">{s.role}</p>}
                      {s.designation && <p className="text-xs text-subtle">{s.designation}</p>}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {cert.pdfUrl && (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-line/10 pt-5">
                <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                  <FaFilePdf aria-hidden /> View certificate
                </a>
                <a href={`${cert.pdfUrl}?download=1`} className="inline-flex items-center gap-2 rounded-lg border border-line/15 px-4 py-2 text-sm font-semibold text-ink-2 hover:border-orange-500">
                  Download PDF
                </a>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-subtle">
          <Link href="/certificates" className="inline-flex items-center gap-1.5 underline hover:text-orange-600 dark:hover:text-orange-400">
            <FaSearch className="text-xs" aria-hidden /> Verify another certificate
          </Link>
        </p>
      </div>
    </div>
  );
}
