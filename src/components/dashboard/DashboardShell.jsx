'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiMenuAlt2 } from 'react-icons/hi';
import useAuth from '@/hooks/useAuth';
import Skeleton from '@/components/ui/Skeleton';
import { DashboardSkeleton } from '@/components/loading/PageSkeletons';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Sidebar from './Sidebar';

export default function DashboardShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  // The proxy already blocks non-admins; this covers a session that expired while the page was open.
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    else if (!loading && user.role !== 'admin') router.replace('/account');
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-canvas">
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line/10 bg-surface p-5 lg:block" aria-hidden>
          <Skeleton className="h-8 w-28" />
          {Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="mt-5 h-5 w-40" />)}
        </aside>
        <div className="lg:pl-64">
          <div className="mx-auto max-w-[1600px] p-4 md:p-8">
            <DashboardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/10 bg-surface px-4 lg:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded p-2 text-body hover:bg-line/10" aria-label="Open menu">
              <HiMenuAlt2 size={22} />
            </button>
          </div>
        </div>
        <main className="mx-auto max-w-[1600px] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
