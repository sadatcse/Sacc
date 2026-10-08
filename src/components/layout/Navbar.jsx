'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiMenu, HiX } from 'react-icons/hi';
import { FaUserCircle, FaUserPlus } from 'react-icons/fa';
import { mainNav } from '@/config/navigation';
import { cn } from '@/lib/utils';
import Container from '@/components/ui/Container';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const JOIN_HREF = '/join';

function isActive(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

// Sticky site header. Desktop (lg+): inline links + Join / Sign in / theme. Mobile: full-screen menu.
export default function Navbar() {
  const pathname = usePathname() || '/';
  // The menu remembers the page it was opened on, so navigating closes it
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === pathname;
  const setOpen = (value) => setOpenOn(value ? pathname : null);
  const links = mainNav.filter((l) => l.href !== JOIN_HREF); // "Join Us" is shown as a button

  // Lock page scroll while the menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/10 bg-canvas/85 backdrop-blur-md">
      <Container className="flex h-16 max-w-7xl 2xl:max-w-screen-2xl items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-2.5 py-2 text-sm font-medium transition-colors xl:px-3.5',
                isActive(pathname, link.href) ? 'text-orange-600 dark:text-orange-400' : 'text-muted hover:text-ink'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:flex" />
          {/* Signed-in users are sent on to their dashboard / account by the proxy */}
          <Link
            href="/login"
            className="hidden items-center gap-2 rounded-lg border border-line/15 px-3.5 py-2 text-sm font-semibold text-body transition-colors hover:border-orange-500/60 hover:text-ink lg:inline-flex"
          >
            <FaUserCircle aria-hidden /> Sign in
          </Link>
          <Link
            href={JOIN_HREF}
            className="hidden items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-opacity hover:opacity-90 sm:inline-flex"
          >
            <FaUserPlus aria-hidden /> Join Us
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-body hover:bg-line/5 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>
      </Container>

      {/* Mobile / tablet menu */}
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-canvas lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            <nav className="flex flex-col" aria-label="Mobile">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(pathname, link.href) ? 'page' : undefined}
                  className={cn(
                    'rounded-lg px-4 py-3.5 text-base font-medium transition-colors',
                    isActive(pathname, link.href) ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-body hover:bg-line/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 grid gap-3 border-t border-line/10 pt-5 sm:grid-cols-2">
              <Link
                href={JOIN_HREF}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 font-semibold text-white"
              >
                <FaUserPlus aria-hidden /> Join the Club
              </Link>
              <Link href="/login" className="flex items-center justify-center gap-2 rounded-lg border border-line/15 px-4 py-3 font-semibold text-body">
                <FaUserCircle aria-hidden /> Sign in
              </Link>
            </div>
            <ThemeToggle variant="row" className="mt-3" />
          </Container>
        </div>
      )}
    </header>
  );
}
