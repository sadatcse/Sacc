import { Fragment } from 'react';
import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

// Page banner (follows light / dark theme) with breadcrumb, title and optional extra content (tabs, etc.).
// breadcrumbs: [{ label, href? }] — "Home" is added automatically.
export default function DarkPageHeader({ title, accent, subtitle, breadcrumbs = [], children }) {
  const crumbs = [{ label: 'Home', href: '/' }, ...breadcrumbs];
  return (
    <header className="relative overflow-hidden border-b border-line/10 bg-canvas-2">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(220,38,38,0.22),transparent_60%)]" />
      <div className="container relative max-w-7xl 2xl:max-w-screen-2xl py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-subtle">
          {crumbs.map((crumb, i) => (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <FaChevronRight className="text-[9px]" aria-hidden />}
              {crumb.href && i < crumbs.length - 1 ? (
                <Link href={crumb.href} className="hover:text-orange-600 dark:hover:text-orange-400">{crumb.label}</Link>
              ) : (
                <span className="font-medium text-ink-2" aria-current="page">{crumb.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
        {title && (
          <>
            <h1 className="text-3xl font-extrabold text-ink md:text-4xl">
              {title} {accent && <span className="text-orange-500">{accent}</span>}
            </h1>
            <span className="mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-red-600 to-orange-500" />
          </>
        )}
        {subtitle && <p className="mt-4 max-w-2xl text-muted">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}
