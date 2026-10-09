import { cn } from '@/lib/utils';

// Grey placeholder block shown while data loads. Size it with className (h-4 w-32, aspect-video, …).
export default function Skeleton({ className, rounded = 'rounded-md' }) {
  return <span aria-hidden className={cn('block animate-pulse bg-line/10', rounded, className)} />;
}

// Several text lines; the last one shorter
export function SkeletonText({ lines = 3, className }) {
  return (
    <span aria-hidden className={cn('block space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </span>
  );
}

// Screen-reader announcement for a loading region
export function LoadingLabel({ children = 'Loading…' }) {
  return (
    <span role="status" className="sr-only">
      {children}
    </span>
  );
}
