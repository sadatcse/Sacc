'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CiLogout } from 'react-icons/ci';
import { TbLayoutDashboard } from 'react-icons/tb';
import useAuth from '@/hooks/useAuth';
import { accountNav } from '@/config/navigation';
import { cn } from '@/lib/utils';
import Logo from '@/components/layout/Logo';
import Skeleton from '@/components/ui/Skeleton';
import { FormSkeleton } from '@/components/loading/PageSkeletons';
import ThemeToggle from '@/components/layout/ThemeToggle';

// Layout for /account — any signed-in user (students and alumni land here; admins can visit too)
export default function AccountShell({ children }) {
  const { user, profile, loading, logOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login?from=/account');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="h-16 border-b border-line/10 bg-surface" />
        <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-red-950">
          <div className="container flex max-w-5xl items-center gap-4 py-8">
            <Skeleton className="h-16 w-16 bg-white/10" rounded="rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 bg-white/10" />
              <Skeleton className="h-4 w-64 bg-white/10" />
            </div>
          </div>
        </div>
        <div className="container max-w-5xl py-8">
          <FormSkeleton cards={2} />
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line/10 bg-surface">
        <div className="container flex h-16 max-w-5xl items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user.role === 'admin' && (
              <Link href="/dashboard" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-line/10 sm:flex">
                <TbLayoutDashboard /> Dashboard
              </Link>
            )}
            <button type="button" onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg border border-line/10 px-3 py-2 text-sm font-medium text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
              <CiLogout className="text-lg" /> Log out
            </button>
          </div>
        </div>
      </header>

      {/* Profile banner */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-red-950 text-white">
        <div className="container flex max-w-5xl items-center gap-4 py-6 sm:py-8">
          {profile?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- any user-supplied URL
            <img src={profile.photo} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-orange-500" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-500 text-2xl font-bold">
              {user.name?.charAt(0)}
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">{user.name}</h1>
            <p className="text-sm text-neutral-300">
              {user.email}
            </p>
          </div>
        </div>
        <nav className="container flex max-w-5xl gap-1 overflow-x-auto" aria-label="Account">
          {accountNav.filter((item) => !item.roles || item.roles.includes(user.role)).map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
                pathname === href ? 'bg-canvas text-ink' : 'text-neutral-300 hover:text-white'
              )}
            >
              <Icon aria-hidden /> {label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="container max-w-5xl py-8">{children}</main>
    </div>
  );
}
