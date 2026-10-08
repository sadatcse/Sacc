'use client';
import Link from 'next/link';

// Shown when a page fails to render (e.g. the database is unreachable)
export default function Error({ reset }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-canvas px-4 text-center text-body">
      <p className="text-sm font-semibold uppercase tracking-widest text-orange-500">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-extrabold text-ink">We couldn&apos;t load this page</h1>
      <p className="mt-3 max-w-md text-muted">Please try again in a moment. If it keeps happening, let the club admins know.</p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-line/15 px-5 py-2.5 text-sm font-semibold text-ink-2 hover:border-orange-500">
          Go home
        </Link>
      </div>
    </div>
  );
}
