'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { appOnlyRoutes } from '@/config/navigation';
import AuthProvider from '@/providers/AuthProvider';
import Navbar from './Navbar';
import Footer from './Footer';

function useVisitorLog(enabled) {
  useEffect(() => {
    if (!enabled) return;
    try {
      if (sessionStorage.getItem('visitor_logged')) return;
    } catch {}
    fetch('/api/visitor/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrer: document.referrer || '',
        path: window.location.pathname || '/',
        userAgent: navigator.userAgent || 'Unknown',
      }),
    })
      .then(() => {
        try {
          sessionStorage.setItem('visitor_logged', 'true');
        } catch {}
      })
      .catch(() => {});
  }, [enabled]);
}

// Public pages get Navbar + Footer; /dashboard and /login get the auth context instead.
export default function AppShell({ children }) {
  const pathname = usePathname() || '/';
  const isAppRoute = appOnlyRoutes.some((route) => pathname.startsWith(route));

  useVisitorLog(!isAppRoute);

  if (isAppRoute) return <AuthProvider>{children}</AuthProvider>;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
