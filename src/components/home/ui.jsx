import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Building blocks shared by the dark home-page sections.

export function HomeHeading({ children, className }) {
  return (
    <div className={cn('mb-10 text-center', className)}>
      <h2 className="text-2xl uppercase tracking-wide text-ink md:text-3xl">{children}</h2>
      <span className="mx-auto mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-red-600 to-orange-500" />
    </div>
  );
}

const BUTTON_VARIANTS = {
  red: 'bg-red-600 text-white shadow-lg shadow-red-900/40 hover:bg-red-500',
  orange: 'bg-orange-500 text-white shadow-lg shadow-orange-900/40 hover:bg-orange-400',
  outline: 'border border-orange-500/70 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white',
};

export function HomeButton({ href, variant = 'orange', className, children }) {
  const isExternal = href.startsWith('http');
  return (
    <Link
      href={href}
      {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5',
        BUTTON_VARIANTS[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

// Dark card with an orange glow on hover
export function Panel({ children, className }) {
  return (
    <div
      className={cn(
        'h-full rounded-xl border border-line/10 bg-surface/70 transition-colors duration-300 hover:border-orange-500/60 hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.6)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function IconBadge({ icon: Icon, className, size = 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400',
        size === 'lg' ? 'h-14 w-14 text-2xl' : 'h-11 w-11 text-lg',
        className
      )}
    >
      <Icon aria-hidden />
    </span>
  );
}

export function DateBadge({ day, month }) {
  return (
    <span className="absolute left-3 top-3 z-10 rounded-md bg-orange-500 px-2 py-1 text-center leading-none text-white shadow-lg">
      <span className="block text-lg font-bold">{day}</span>
      <span className="block text-[10px] font-semibold tracking-wider">{month}</span>
    </span>
  );
}

// Photo that zooms slightly on hover; parent decides the size via className
export function CoverImage({ src, alt, className, sizes = '(min-width: 1024px) 25vw, 50vw' }) {
  return (
    <div className={cn('group relative overflow-hidden', className)}>
      <Image src={src} alt={alt} fill sizes={sizes} unoptimized={/^https?:/.test(src) && !src.includes('images.unsplash.com')} className="object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
    </div>
  );
}

export function HomeSection({ id, children, className }) {
  return (
    <section id={id} className={cn('relative py-16 md:py-20', className)}>
      <div className="container max-w-7xl 2xl:max-w-screen-2xl">{children}</div>
    </section>
  );
}
