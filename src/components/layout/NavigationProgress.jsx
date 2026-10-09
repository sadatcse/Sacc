'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Thin animated bar at the top of the screen while a link click is navigating.
// It starts on any same-site link click and disappears as soon as the URL changes
// (the route's loading.jsx skeleton takes over from there).
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = `${pathname}?${searchParams}`;
  const [startedOn, setStartedOn] = useState(null); // URL the navigation started from
  const loading = startedOn === current;

  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest?.('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return; // same page / hash link
      setStartedOn(`${window.location.pathname}?${new URLSearchParams(window.location.search)}`);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  if (!loading) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]" role="progressbar" aria-label="Loading page">
      <div className="h-full animate-[nav-progress_8s_cubic-bezier(0.1,0.7,0.3,1)_forwards] bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 shadow-[0_0_10px_rgba(249,115,22,0.7)]" />
    </div>
  );
}
