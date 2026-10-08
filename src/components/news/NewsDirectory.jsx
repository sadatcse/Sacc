'use client';
import { useDeferredValue, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { FaArrowRight, FaChevronDown, FaThLarge, FaMapMarkerAlt, FaRegClock, FaRegNewspaper, FaSearch, FaTimes } from 'react-icons/fa';
import NewsCard, { CategoryBadge, StatusBadge } from '@/components/news/NewsCard';
import { UPCOMING, newsCategories } from '@/data/news-categories';
import { cn, formatCalendarDate } from '@/lib/utils';

const TYPES = [
  { key: 'all', label: 'All' },
  { key: 'article', label: 'Articles' },
  { key: 'event', label: 'Events' },
];

const PAGE_SIZE = 9;

const inCategory = (post, key) => !key || (key === UPCOMING ? post.status === 'upcoming' : post.category === key);

function initials(name) {
  return name.split(/\s+/).filter((w) => /^[A-Z]/.test(w) && !w.endsWith('.')).slice(0, 2).map((w) => w[0]).join('') || name[0];
}

// Big two-column card for the top featured post
function FeaturedPost({ post }) {
  const isEvent = post.type === 'event';
  return (
    <Link
      href={`/news/${post.slug}`}
      className="group grid overflow-hidden rounded-2xl border border-line/10 bg-surface/70 transition-all duration-300 hover:border-orange-500/60 hover:shadow-[0_0_50px_-15px_rgba(249,115,22,0.6)] lg:grid-cols-[1.35fr_1fr]"
    >
      <div className="relative aspect-[16/9] overflow-hidden lg:aspect-auto lg:min-h-[340px]">
        <Image src={post.cover} alt="" fill priority sizes="(min-width: 1024px) 720px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-neutral-950/40" />
        <span className="absolute left-4 top-4 rounded-full border border-orange-500/50 bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-400 backdrop-blur">
          Featured
        </span>
      </div>
      <div className="flex flex-col justify-center p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge>{post.categoryLabel}</CategoryBadge>
          {isEvent && <StatusBadge status={post.status} />}
        </div>
        <h2 className="mt-4 text-2xl font-extrabold leading-tight text-ink transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400 md:text-3xl">{post.title}</h2>
        <p className="mt-3 line-clamp-3 text-muted">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-subtle">
          {isEvent ? (
            <>
              <span>{formatCalendarDate(post.event.date)}</span>
              <span className="inline-flex items-center gap-1.5"><FaMapMarkerAlt className="text-orange-500" aria-hidden />{post.event.venue}</span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-500 text-[11px] font-bold text-white">
                  {initials(post.author.name)}
                </span>
                <span className="font-medium text-body">{post.author.name}</span>
              </span>
              <span>{formatCalendarDate(post.date)}</span>
              <span className="inline-flex items-center gap-1.5"><FaRegClock className="text-orange-500" aria-hidden />{post.readingTime} min read</span>
            </>
          )}
        </div>
        <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
          {isEvent ? 'View event' : 'Read article'}
          <FaArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

// Searchable, filterable news & events grid. `posts` are toCard() objects, newest first.
// `initialCategory` comes from /news?category=<key> so categories can be linked to.
export default function NewsDirectory({ posts, initialCategory = '' }) {
  const [category, setCategoryState] = useState(initialCategory);
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);

  // Category chips with their post counts; empty categories are hidden (Upcoming Events always shows)
  const categories = useMemo(
    () =>
      newsCategories
        .map((c) => ({ ...c, count: posts.filter((p) => inCategory(p, c.key)).length }))
        .filter((c) => c.count > 0 || c.key === UPCOMING),
    [posts]
  );

  const isFiltering = category || type !== 'all' || deferredQuery.trim();
  const featured = isFiltering ? null : posts.find((p) => p.featured);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const list = posts
      .filter((p) => inCategory(p, category))
      .filter((p) => type === 'all' || p.type === type)
      .filter((p) => !q || [p.title, p.excerpt, p.categoryLabel, p.author.name, ...p.tags].some((v) => v.toLowerCase().includes(q)));
    // Upcoming events read best soonest-first
    return category === UPCOMING ? list.sort((a, b) => a.event.date.localeCompare(b.event.date)) : list;
  }, [posts, category, type, deferredQuery]);

  const grid = featured ? results.filter((p) => p.slug !== featured.slug) : results;
  const shown = grid.slice(0, visible);

  // Keep ?category= in the address bar so a filtered view can be shared
  const setCategory = (key) => {
    setCategoryState(key);
    const url = new URL(window.location.href);
    if (key) url.searchParams.set('category', key);
    else url.searchParams.delete('category');
    window.history.replaceState(null, '', url);
  };
  const resetPaging = (fn) => (value) => {
    fn(value);
    setVisible(PAGE_SIZE);
  };
  const clearAll = () => {
    setCategory('');
    setType('all');
    setQuery('');
    setVisible(PAGE_SIZE);
  };

  const chipClass = (active) =>
    cn(
      'relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors',
      active ? 'border-transparent text-white' : 'border-line/10 bg-surface text-muted hover:border-orange-500/60 hover:text-ink-2'
    );
  const chips = [{ key: '', label: 'All', icon: FaThLarge, count: posts.length }, ...categories];

  return (
    <MotionConfig reducedMotion="user">
      {featured && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mb-10">
          <FeaturedPost post={featured} />
        </motion.div>
      )}

      {/* Category chips */}
      <nav aria-label="News categories" className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
        <div className="flex gap-2 lg:flex-wrap">
          {chips.map(({ key, label, icon: Icon, count }) => {
            const active = category === key;
            return (
              <button key={key || 'all'} type="button" aria-pressed={active} onClick={() => resetPaging(setCategory)(key)} className={chipClass(active)}>
                {active && (
                  <motion.span layoutId="news-category" className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600 to-orange-500" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                )}
                <Icon className={cn('relative text-xs', active ? 'text-white' : 'text-orange-500')} aria-hidden />
                <span className="relative">{label}</span>
                <span className={cn('relative rounded-full px-1.5 text-[11px]', active ? 'bg-white/20 text-white' : 'bg-line/5 text-subtle')}>{count}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Type + search */}
      <div className="mt-4 flex flex-col gap-3 border-b border-line/10 pb-5 sm:flex-row sm:items-center sm:justify-end">
        <label className="relative inline-flex h-10 items-center gap-1.5 rounded-md border border-line/10 bg-surface pl-3 pr-8 text-sm transition-colors focus-within:border-orange-500 hover:border-orange-500/60">
          <span className="text-subtle">Type:</span>
          <select
            value={type}
            onChange={(e) => resetPaging(setType)(e.target.value)}
            className="cursor-pointer appearance-none bg-transparent font-medium text-ink-2 outline-none [&>option]:bg-surface"
          >
            {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <FaChevronDown className="pointer-events-none absolute right-3 text-[10px] text-muted" aria-hidden />
        </label>
        <div className="relative sm:w-72">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => resetPaging(setQuery)(e.target.value)}
            placeholder="Search news & events…"
            aria-label="Search news and events"
            className="h-10 w-full rounded-md border border-line/10 bg-surface pl-9 pr-3 text-sm text-ink-2 outline-none transition-colors placeholder:text-subtle hover:border-orange-500/60 focus:border-orange-500"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-subtle">
        <p>
          Showing <span className="font-semibold text-ink-2">{Math.min(visible, grid.length) + (featured ? 1 : 0)}</span> of{' '}
          <span className="font-semibold text-ink-2">{results.length}</span> posts
        </p>
        {isFiltering && (
          <button type="button" onClick={clearAll} className="inline-flex items-center gap-1.5 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">
            <FaTimes className="text-xs" aria-hidden /> Clear filters
          </button>
        )}
      </div>

      {grid.length > 0 ? (
        <motion.div layout className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((post, i) => (
              <motion.div
                key={post.slug}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: (i % PAGE_SIZE) * 0.04 } }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
              >
                <NewsCard post={post} priority={i < 3} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        !featured && (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-line/10 py-16 text-center">
            <FaRegNewspaper className="text-4xl text-faint" aria-hidden />
            <p className="mt-4 font-semibold text-ink">{category === UPCOMING ? 'No upcoming events right now' : 'No posts match your filters'}</p>
            <p className="mt-1 text-sm text-subtle">
              {category === UPCOMING ? 'New events are announced here first — check back soon.' : 'Try a different keyword or category.'}
            </p>
            <button type="button" onClick={clearAll} className="mt-5 rounded-md border border-orange-500/60 px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 transition-colors hover:bg-orange-500 hover:text-white">
              {category === UPCOMING ? 'Browse all posts' : 'Clear filters'}
            </button>
          </div>
        )
      )}

      {visible < grid.length && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="inline-flex items-center gap-2 rounded-full border border-line/15 bg-surface px-6 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-orange-500 hover:text-ink"
          >
            Load more <span className="text-subtle">({grid.length - visible})</span>
          </button>
        </div>
      )}
    </MotionConfig>
  );
}
