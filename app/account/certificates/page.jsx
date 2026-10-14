import Link from 'next/link';
import { FaCertificate, FaFilePdf, FaDownload, FaCheckCircle } from 'react-icons/fa';
import { getServerSession } from '@/lib/auth-guard';
import { getCertificatesForUser } from '@/server/services/certificate.service';
import { formatCalendarDate } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = { title: 'Certificates' };
export const dynamic = 'force-dynamic';

// The signed-in member's executive committee certificates (only they and admins can open the PDFs)
export default async function Page() {
  const session = await getServerSession();
  const certificates = session ? await getCertificatesForUser(session._id) : [];

  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-ink">Certificates</h1>
      <p className="mb-6 text-sm text-muted">Certificates you received for serving on the club&apos;s executive committee.</p>
      {!certificates.length ? (
        <EmptyState
          title="No certificates yet"
          description="Student executives receive a certificate for each committee year. If you served and don't see yours, ask the club to check that your student ID matches your executive profile."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((c) => (
            <div key={c.code} className="flex flex-col rounded-xl border border-line/10 bg-surface p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400"><FaCertificate aria-hidden /></span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">Executive Committee {c.year}</p>
                  <p className="text-sm text-muted">{c.role}</p>
                  <p className="mt-1 font-mono text-xs text-subtle">{c.code}</p>
                  {c.issuedOn && <p className="text-xs text-subtle">Issued {formatCalendarDate(c.issuedOn)}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
                <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-orange-600 hover:underline dark:text-orange-400">
                  <FaFilePdf aria-hidden /> View
                </a>
                <a href={`${c.pdfUrl}?download=1`} className="inline-flex items-center gap-1.5 text-muted hover:text-orange-600 dark:hover:text-orange-400">
                  <FaDownload aria-hidden /> Download PDF
                </a>
                <Link href={c.verifyUrl} className="inline-flex items-center gap-1.5 text-muted hover:text-orange-600 dark:hover:text-orange-400">
                  <FaCheckCircle aria-hidden /> Verify page
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
