'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { FaDesktop, FaMoon, FaSun } from 'react-icons/fa';
import { cn } from '@/lib/utils';

// Theme choice is stored in localStorage('theme') = 'light' | 'dark' (missing = follow the system).
// The inline script in app/layout.jsx applies it before first paint; this button changes it.
const MODES = [
  { key: 'light', label: 'Light mode', icon: FaSun },
  { key: 'dark', label: 'Dark mode', icon: FaMoon },
  { key: 'system', label: 'System theme', icon: FaDesktop },
];
const EVENT = 'themechange';

function readMode() {
  try {
    return localStorage.getItem('theme') || 'system';
  } catch {
    return 'system';
  }
}

function applyMode(mode) {
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

function saveMode(mode) {
  try {
    if (mode === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', mode);
  } catch {
    /* storage blocked — the choice lasts for this page only */
  }
  applyMode(mode);
  window.dispatchEvent(new Event(EVENT)); // keeps every toggle on the page in sync
}

// Re-render on our own changes and on changes from other tabs
function subscribe(callback) {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

// variant: 'icon' (round button) | 'row' (full-width labelled button for menus)
export default function ThemeToggle({ variant = 'icon', className }) {
  // null on the server (it can't know the visitor's theme)
  const mode = useSyncExternalStore(subscribe, readMode, () => null);

  // Follow OS changes while in system mode
  useEffect(() => {
    if (mode !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyMode('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const current = MODES.find((m) => m.key === mode) || MODES[2];
  const next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
  const Icon = current.icon;

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={() => saveMode(next.key)}
        className={cn('flex w-full items-center justify-between gap-3 rounded-lg border border-line/10 px-3 py-2.5 text-sm font-medium text-body hover:bg-line/5', className)}
      >
        <span className="flex items-center gap-2"><Icon aria-hidden /> {mode ? current.label : 'Theme'}</span>
        <span className="flex items-center gap-1 text-xs text-subtle" title={`Switch to ${next.label.toLowerCase()}`}>Change</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => saveMode(next.key)}
      title={`${current.label} — switch to ${next.label.toLowerCase()}`}
      aria-label={`${current.label}. Switch to ${next.label.toLowerCase()}`}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line/10 text-muted transition-colors hover:border-orange-500/60 hover:text-orange-500',
        className
      )}
    >
      <Icon className={mode ? '' : 'opacity-0'} aria-hidden />
    </button>
  );
}
