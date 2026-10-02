'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HiX } from 'react-icons/hi';
import { CiLogout } from 'react-icons/ci';
import { dashboardNav } from '@/config/navigation';
import useAuth from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import Logo from '@/components/layout/Logo';

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logOut, user } = useAuth();

  const handleLogout = async () => {
    await logOut().catch(() => {});
    router.push('/login');
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
        <Logo />
        <button type="button" onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Close menu">
          <HiX size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {dashboardNav.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{group.title}</p>
            <ul className="space-y-1">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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

      <div className="border-t border-gray-200 p-4">
        {user?.email && <p className="mb-3 truncate px-1 text-xs text-gray-500">{user.email}</p>}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
        >
          <CiLogout className="text-lg" /> Log out
        </button>
      </div>
    </div>
  );
}
