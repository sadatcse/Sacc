'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiMenuAlt2 } from 'react-icons/hi';
import useAuth from '@/hooks/useAuth';
import Spinner from '@/components/ui/Spinner';
import Logo from '@/components/layout/Logo';
import Sidebar from './Sidebar';

export default function DashboardShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  // The proxy already blocks unauthenticated requests; this covers an expired Firebase session.
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner label="Checking your session…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <Logo />
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded p-2 text-gray-700 hover:bg-gray-100" aria-label="Open menu">
            <HiMenuAlt2 size={22} />
          </button>
        </div>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
