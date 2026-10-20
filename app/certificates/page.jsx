import { redirect } from 'next/navigation';
import { FaSearch, FaQrcode, FaShieldAlt, FaUserTie, FaTrophy, FaMicrophone, FaUsers } from 'react-icons/fa';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import { siteConfig } from '@/config/site';

export const metadata = {
  alternates: { canonical: '/certificates' },
  title: 'Verify a Certificate',
  description: `Check that a certificate was issued by the ${siteConfig.name} — executive committee, contest, seminar and workshop certificates.`,
};

const KINDS = [
  { icon: FaUserTie, label: 'Executive committee' },
  { icon: FaTrophy, label: 'Contest winners' },
  { icon: FaUsers, label: 'Participants & volunteers' },
  { icon: FaMicrophone, label: 'Speakers, guests & judges' },
];

// Universal certificate verification. /certificates?code=SACC-2026-7KQ4MZ → /certificates/SACC-2026-7KQ4MZ
// (the QR code on every certificate opens the same page)
export default async function Page({ searchParams }) {
  const code = String((await searchParams).code || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (code) redirect(`/certificates/${code}`);

  return (
    <div className="min-h-[70vh] bg-canvas text-body">
      <DarkPageHeader
        title="Verify a"
        accent="Certificate"
        subtitle="Every certificate the club issues — executive committee, programming contests, seminars and workshops — can be checked here."
        breadcrumbs={[{ label: 'Verify Certificate' }]}
      />
      <div className="container max-w-2xl py-12">
        <form method="get" className="rounded-2xl border border-line/10 bg-surface p-4 shadow-sm sm:p-5">
          <label htmlFor="code" className="mb-2 block text-sm font-semibold text-ink">Certificate ID</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="code"
              name="code"
              required
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. SACC-2026-7KQ4MZ or SACC-E26-7KQ4MZ"
              className="min-w-0 flex-1 rounded-lg border border-line/20 bg-canvas px-4 py-3 font-mono uppercase text-ink placeholder:normal-case placeholder:text-faint focus:border-orange-500 focus:outline-none"
            />
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
              <FaSearch aria-hidden /> Verify
            </button>
          </div>
          <p className="mt-3 text-xs text-subtle">The ID is printed at the bottom right of the certificate.</p>
        </form>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3 rounded-xl border border-line/10 bg-surface p-4">
            <FaQrcode className="mt-0.5 shrink-0 text-xl text-orange-600 dark:text-orange-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">Scan the QR code</p>
              <p className="text-sm text-muted">Every certificate has a QR code at the bottom left that opens its verification page.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-line/10 bg-surface p-4">
            <FaShieldAlt className="mt-0.5 shrink-0 text-xl text-orange-600 dark:text-orange-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">Genuine or revoked</p>
              <p className="text-sm text-muted">The page shows who it was issued to, for what, and whether it is still valid.</p>
            </div>
          </div>
        </div>

        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {KINDS.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-2 rounded-full border border-line/10 px-3 py-1.5 text-xs text-muted">
              <Icon className="text-orange-600 dark:text-orange-400" aria-hidden /> {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
