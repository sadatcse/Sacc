import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight, FaCalendarAlt, FaMapMarkerAlt, FaRegClock } from 'react-icons/fa';
import { cn, formatCalendarDate } from '@/lib/utils';

export function CategoryBadge({ children, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow', className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  if (!status) return null;
  const upcoming = status === 'upcoming';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur',
        upcoming ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'border-white/15 bg-black/50 text-neutral-200'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', upcoming ? 'animate-pulse bg-emerald-400' : 'bg-neutral-500')} aria-hidden />
      {upcoming ? 'Upcoming' : 'Completed'}
    </span>
  );
}

// Small "27 / APR" calendar tile for event covers
function DateTile({ date }) {
  return (
    <span className="flex w-14 flex-col items-center overflow-hidden rounded-lg border border-white/15 bg-black/70 text-center backdrop-blur">
      <span className="w-full bg-gradient-to-r from-red-600 to-orange-500 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
        {formatCalendarDate(date, { month: 'short' })}
      </span>
      <span className="py-1 text-xl font-extrabold leading-none text-white">{formatCalendarDate(date, { day: 'numeric' })}</span>
    </span>
  );
}

// Card used on /news and in "related posts". `post` is the shape from toCard() in src/lib/news-utils.js.
export default function NewsCard({ post, priority = false }) {
  const isEvent = post.type === 'event';
  return (
    <Link
      href={`/news/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line/10 bg-surface/70 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/60 hover:shadow-[0_0_40px_-12px_rgba(249,115,22,0.6)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={post.cover}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <CategoryBadge>{post.categoryLabel}</CategoryBadge>
        </div>
        {isEvent && (
          <div className="absolute right-3 top-3">
            <DateTile date={post.event.date} />
          </div>
        )}
        {isEvent && (
          <div className="absolute bottom-3 left-3">
            <StatusBadge status={post.status} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-ink transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400">{post.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/10 pt-4 text-xs text-subtle">
            {isEvent ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <FaCalendarAlt className="text-orange-500" aria-hidden />
                  {formatCalendarDate(post.event.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1.5"><FaMapMarkerAlt className="shrink-0 text-orange-500" aria-hidden /><span className="truncate">{post.event.venue}</span></span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5"><FaCalendarAlt className="text-orange-500" aria-hidden />{formatCalendarDate(post.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="inline-flex items-center gap-1.5"><FaRegClock className="text-orange-500" aria-hidden />{post.readingTime} min read</span>
              </>
            )}
            <FaArrowRight className="ml-auto text-faint transition-all group-hover:translate-x-1 group-hover:text-orange-600 dark:group-hover:text-orange-400" aria-hidden />
          </div>
        </div>
      </div>
    </Link>
  );
}
