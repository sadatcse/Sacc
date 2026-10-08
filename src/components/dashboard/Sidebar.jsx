'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HiX } from 'react-icons/hi';
import { CiLogout } from 'react-icons/ci';
import { dashboardNav } from '@/config/navigation';
import useAuth from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logOut, user } = useAuth();

  const handleLogout = async () => {
    await logOut().catch(() => {});
    router.push('/login');
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-line/10 bg-surface">
      <div className="flex h-16 items-center justify-between border-b border-line/10 px-5">
        <Logo />
        <button type="button" onClick={onClose} className="rounded p-1 text-subtle hover:bg-line/10 lg:hidden" aria-label="Close menu">
          <HiX size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {dashboardNav.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-faint">{group.title}</p>
            <ul className="space-y-1">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'text-muted hover:bg-line/5 hover:text-ink'
                      )}
                    >
                      {Icon && <Icon className="text-lg" />}
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line/10 p-4">
        {user?.email && <p className="mb-3 truncate px-1 text-xs text-subtle">{user.email}</p>}
        <ThemeToggle variant="row" className="mb-2" />
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-line/10 px-3 py-2 text-sm font-medium text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
        >
          <CiLogout className="text-lg" /> Log out
        </button>
      </div>
    </div>
  );
}
