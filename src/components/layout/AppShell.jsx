'use client';
import { Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { appOnlyRoutes } from '@/config/navigation';
import AuthProvider from '@/providers/AuthProvider';
import { setTimeZone } from '@/lib/timezone';
import Navbar from './Navbar';
import Footer from './Footer';
import NavigationProgress from './NavigationProgress';

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
// timeZone comes from the site settings (app/layout.jsx) so dates match the server's rendering.
export default function AppShell({ children, timeZone, contact }) {
  setTimeZone(timeZone);
  const pathname = usePathname() || '/';
  const isAppRoute = appOnlyRoutes.some((route) => pathname.startsWith(route));

  useVisitorLog(!isAppRoute);

  // useSearchParams inside the progress bar needs its own Suspense boundary
  const progress = (
    <Suspense fallback={null}>
      <NavigationProgress />
    </Suspense>
  );

  if (isAppRoute) {
    return (
      <AuthProvider>
        {progress}
        {children}
      </AuthProvider>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {progress}
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer contact={contact} />
    </div>
  );
}
