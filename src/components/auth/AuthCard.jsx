import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/config/site';
import ThemeToggle from '@/components/layout/ThemeToggle';

// Centred card used by /login and /register (follows the light / dark theme)
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.25),transparent_60%)]" />
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <Image src="/logo.png" alt={`${siteConfig.name} logo`} width={52} height={48} className="h-12 w-auto" priority />
          <span className="text-xl font-extrabold text-ink">{siteConfig.shortName}</span>
        </Link>
        <div className="rounded-2xl border border-line/10 bg-surface/80 p-7 shadow-2xl backdrop-blur md:p-8">
          <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <span className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-red-600 to-orange-500" />
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
      </div>
    </div>
  );
}

// Text input for the auth pages
export function AuthInput({ label, name, ...props }) {
  return (
    <label htmlFor={name} className="block">
      <span className="mb-1.5 block text-sm font-medium text-body">{label}</span>
      <input
        id={name}
        name={name}
        className="h-11 w-full rounded-lg border border-line/10 bg-canvas/60 px-3 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-orange-500/50 focus:border-orange-500"
        {...props}
      />
    </label>
  );
}

export function AuthButton({ children, ...props }) {
  return (
    <button
      type="submit"
      className="h-11 w-full rounded-lg bg-gradient-to-r from-red-600 to-orange-500 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthError({ children }) {
  if (!children) return null;
  return <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{children}</p>;
}
