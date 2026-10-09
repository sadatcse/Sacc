// Page-shaped placeholders shown by app/**/loading.jsx while server pages read MongoDB.
// They mirror the real layouts (header banner, card grids, detail pages) so nothing jumps when data arrives.
import Skeleton, { LoadingLabel, SkeletonText } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

// Same banner as DarkPageHeader
export function HeaderSkeleton({ children, withTitle = true }) {
  return (
    <header className="relative overflow-hidden border-b border-line/10 bg-canvas-2">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(220,38,38,0.12),transparent_60%)]" />
      <div className="container relative max-w-7xl py-10 md:py-14 2xl:max-w-screen-2xl">
        <Skeleton className="mb-5 h-3.5 w-40" />
        {withTitle && (
          <>
            <Skeleton className="h-9 w-72 max-w-full" />
            <span className="mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-red-600/50 to-orange-500/50" />
            <SkeletonText lines={2} className="mt-5 max-w-2xl" />
          </>
        )}
        {children}
      </div>
    </header>
  );
}

function Shell({ children, label }) {
  return (
    <div className="min-h-[70vh] bg-canvas" aria-busy="true">
      <LoadingLabel>{label}</LoadingLabel>
      {children}
    </div>
  );
}

const cardBox = 'overflow-hidden rounded-2xl border border-line/10 bg-surface/70';

// Grid of image cards (news, gallery)
export function CardGridSkeleton({ count = 6, label = 'Loading posts…', chips = true }) {
  return (
    <Shell label={label}>
      <HeaderSkeleton />
      <section className="container max-w-7xl py-10 2xl:max-w-screen-2xl">
        {chips && (
          <div className="mb-8 flex flex-wrap gap-2">
            {Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-9 w-32" rounded="rounded-full" />)}
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className={cardBox}>
              <Skeleton className="aspect-[16/9] w-full" rounded="rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-4/5" />
                <SkeletonText lines={2} />
                <Skeleton className="mt-4 h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

// Executive committee: year tabs + compact person cards
export function PeopleGridSkeleton({ count = 9, label = 'Loading committee…', tabs = true }) {
  const card = (i) => (
    <div key={i} className="flex h-28 overflow-hidden rounded-xl border border-line/10 bg-surface/70">
      <div className="flex-1 space-y-2 p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-full w-28" rounded="rounded-none" />
    </div>
  );
  return (
    <Shell label={label}>
      <HeaderSkeleton>
        {tabs && <Skeleton className="mx-auto mt-8 h-10 w-56" rounded="rounded-xl" />}
      </HeaderSkeleton>
      <div className="container max-w-7xl space-y-10 py-12 2xl:max-w-screen-2xl">
        <div>
          <Skeleton className="mb-6 h-6 w-48" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => card(i))}</div>
        </div>
        <div>
          <Skeleton className="mb-6 h-6 w-52" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: count }, (_, i) => card(i))}</div>
        </div>
      </div>
    </Shell>
  );
}

// Alumni directory: toolbar + avatar cards
export function DirectorySkeleton({ count = 12, label = 'Loading alumni…' }) {
  return (
    <Shell label={label}>
      <HeaderSkeleton />
      <section className="container max-w-7xl py-10 2xl:max-w-screen-2xl">
        <div className="flex flex-col gap-3 border-b border-line/10 pb-5 md:flex-row">
          <Skeleton className="h-10 w-full md:max-w-sm" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-line/10 bg-surface/70 p-4">
              <Skeleton className="h-16 w-16 shrink-0" rounded="rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

// Profile page (executive / alumni): avatar header + content panels + sidebar
export function ProfileSkeleton({ label = 'Loading profile…', sidebar = true }) {
  return (
    <Shell label={label}>
      <HeaderSkeleton withTitle={false}>
        <div className="mt-2 flex flex-col items-center gap-6 sm:flex-row">
          <Skeleton className="h-32 w-32 shrink-0 sm:h-36 sm:w-36" rounded="rounded-full" />
          <div className="w-full max-w-md space-y-3">
            <Skeleton className="mx-auto h-8 w-64 sm:mx-0" />
            <Skeleton className="mx-auto h-5 w-48 sm:mx-0" />
            <div className="flex justify-center gap-2 sm:justify-start">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-7 w-20" rounded="rounded-full" />)}
            </div>
          </div>
        </div>
      </HeaderSkeleton>
      <div className={cn('container max-w-6xl py-10 2xl:max-w-7xl', sidebar && 'grid gap-6 lg:grid-cols-[1fr_320px]')}>
        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-2xl border border-line/10 bg-surface/70 p-6">
              <Skeleton className="mb-5 h-6 w-40" />
              <SkeletonText lines={4} />
            </div>
          ))}
        </div>
        {sidebar && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-line/10 bg-surface/70 p-6">
              <Skeleton className="mb-4 h-3 w-24" />
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="mb-3 h-4 w-full" />)}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

// News article / event page
export function PostSkeleton() {
  return (
    <Shell label="Loading post…">
      <div className="container max-w-5xl py-10 md:py-14">
        <Skeleton className="h-4 w-32" />
        <div className="mt-8 flex gap-2">
          <Skeleton className="h-6 w-28" rounded="rounded-full" />
          <Skeleton className="h-6 w-24" rounded="rounded-full" />
        </div>
        <Skeleton className="mt-4 h-10 w-full max-w-3xl" />
        <Skeleton className="mt-3 h-10 w-2/3" />
        <Skeleton className="mt-8 aspect-[16/9] w-full md:aspect-[2.2/1]" rounded="rounded-2xl" />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-line/10 bg-surface/70 p-6">
            <Skeleton className="mb-5 h-6 w-48" />
            <SkeletonText lines={6} />
          </div>
          <div className="space-y-4 rounded-2xl border border-line/10 bg-surface/70 p-6">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </Shell>
  );
}

// About / Join style page: header + large panels
export function ContentSkeleton({ label = 'Loading…', panels = 3 }) {
  return (
    <Shell label={label}>
      <HeaderSkeleton />
      <div className="container max-w-6xl space-y-6 py-12 2xl:max-w-7xl">
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="rounded-2xl border border-line/10 bg-surface/70 p-7">
              <Skeleton className="h-12 w-12" rounded="rounded-xl" />
              <Skeleton className="mt-5 h-6 w-40" />
              <SkeletonText lines={3} className="mt-4" />
            </div>
          ))}
        </div>
        {Array.from({ length: panels - 1 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-line/10 bg-surface/70 p-7">
            <Skeleton className="mb-5 h-6 w-56" />
            <SkeletonText lines={4} />
          </div>
        ))}
      </div>
    </Shell>
  );
}

// Home page: hero + a few sections
export function HomeSkeleton() {
  return (
    <Shell label="Loading…">
      <section className="bg-canvas-2">
        <div className="container grid max-w-7xl items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-12 w-4/5" />
            <Skeleton className="h-12 w-3/5" />
            <Skeleton className="h-5 w-48" />
            <SkeletonText lines={2} className="max-w-md pt-4" />
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-11 w-40" />
              <Skeleton className="h-11 w-36" />
            </div>
          </div>
          <Skeleton className="mx-auto aspect-square w-full max-w-[380px]" rounded="rounded-full" />
        </div>
      </section>
      <div className="container max-w-7xl py-16">
        <Skeleton className="mx-auto mb-10 h-7 w-56" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={cardBox}>
              <Skeleton className="aspect-[4/3] w-full" rounded="rounded-none" />
              <div className="p-4"><Skeleton className="mx-auto h-4 w-3/4" /></div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// Dashboard page content (inside the dashboard shell)
export function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      <LoadingLabel>Loading dashboard…</LoadingLabel>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" rounded="rounded-lg" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-line/10 bg-surface p-4 sm:p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-3 h-7 w-14" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-line/10 bg-surface">
        <div className="flex gap-3 border-b border-line/10 p-4">
          <Skeleton className="h-9 flex-1" rounded="rounded-lg" />
          <Skeleton className="hidden h-9 w-36 sm:block" rounded="rounded-lg" />
        </div>
        <TableRowsSkeleton />
      </div>
    </div>
  );
}

// Rows for DataTable / lists
export function TableRowsSkeleton({ rows = 6, cols = 4 }) {
  return (
    <div aria-busy="true" className="divide-y divide-line/5">
      <LoadingLabel>Loading records…</LoadingLabel>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-9 w-9 shrink-0" rounded="rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          {Array.from({ length: cols - 1 }, (_, c) => <Skeleton key={c} className="hidden h-3.5 w-20 md:block" />)}
        </div>
      ))}
    </div>
  );
}

// Form-style editors (dashboard)
export function FormSkeleton({ cards = 2 }) {
  return (
    <div aria-busy="true" className="space-y-6">
      <LoadingLabel>Loading…</LoadingLabel>
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="rounded-xl border border-line/10 bg-surface p-5">
          <Skeleton className="mb-5 h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full" rounded="rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
