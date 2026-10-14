import { redirect } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import DarkPageHeader from '@/components/ui/DarkPageHeader';

export const metadata = {
  title: 'Verify a Certificate',
  description: 'Check that an executive committee certificate was issued by the club.',
};

// /certificates?code=SACC-2026-7KQ4MZ → /certificates/SACC-2026-7KQ4MZ (the barcode holds the same code)
export default async function Page({ searchParams }) {
  const code = String((await searchParams).code || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (code) redirect(`/certificates/${code}`);

  return (
    <div className="min-h-[70vh] bg-canvas text-body">
      <DarkPageHeader title="Verify a" accent="Certificate" subtitle="Enter the Certificate ID printed under the barcode, or scan the barcode into the box." breadcrumbs={[{ label: 'Certificates' }]} />
      <div className="container max-w-xl py-12">
        <form method="get" className="flex gap-2 rounded-2xl border border-line/10 bg-surface p-3">
          <label htmlFor="code" className="sr-only">Certificate ID</label>
          <input
            id="code"
            name="code"
            required
            autoFocus
            placeholder="SACC-2026-XXXXXX"
            className="min-w-0 flex-1 rounded-lg border border-line/20 bg-canvas px-4 py-2.5 font-mono uppercase text-ink placeholder:text-faint focus:border-orange-500 focus:outline-none"
          />
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            <FaSearch aria-hidden /> Verify
          </button>
        </form>
      </div>
    </div>
  );
}
