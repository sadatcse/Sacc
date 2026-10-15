'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaQuoteLeft, FaStar, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import SocialLinks from '@/components/ui/SocialLinks';

const AUTO_MS = 4000;
const SWIPE_PX = 40;
// Cards per view: 1 on phones, 2 from sm, 3 from lg (same breakpoints as the [--per] classes below)
const PER_VIEW = [
  ['(min-width: 1024px)', 3],
  ['(min-width: 640px)', 2],
];

function usePerView() {
  const [per, setPer] = useState(3);
  useEffect(() => {
    const queries = PER_VIEW.map(([q, n]) => [window.matchMedia(q), n]);
    const update = () => setPer(queries.find(([mq]) => mq.matches)?.[1] || 1);
    update();
    queries.forEach(([mq]) => mq.addEventListener('change', update));
    return () => queries.forEach(([mq]) => mq.removeEventListener('change', update));
  }, []);
  return per;
}

function AlumniSlide({ person }) {
  const profile = person.slug ? `/alumni/${person.slug}` : null;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line/10 bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10">
      <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-surface-2 to-canvas-2">
        {person.photo ? (
          <Image
            unoptimized
            src={person.photo}
            alt={person.name}
            fill
            loading="eager"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-[center_22%] transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-7xl font-bold text-orange-600/60 dark:text-orange-400/60">{person.name.charAt(0)}</span>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg shadow-orange-500/30">
          <FaStar aria-hidden /> Featured
        </span>
        {person.batch && (
          <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">{person.batch}</span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-xl font-bold leading-tight text-white">{person.name}</h3>
          {(person.role || person.company) && (
            <p className="mt-1 line-clamp-1 text-sm text-neutral-200">
              {person.role}
              {person.company && <>{person.role && <span className="text-orange-400"> @ </span>}<span className="font-semibold text-white">{person.company}</span></>}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {(person.location || person.featured) && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {person.featured && <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 font-semibold text-orange-700 dark:text-orange-300">{person.featured}</span>}
            {person.location && (
              <span className="inline-flex items-center gap-1 text-muted"><FaMapMarkerAlt className="text-[10px] text-orange-500" aria-hidden /> {person.location}</span>
            )}
          </div>
        )}
        <div className="mt-3 flex-1">
          {person.quote && (
            <p className="line-clamp-3 text-sm italic leading-relaxed text-body">
              <FaQuoteLeft className="mr-1.5 inline align-baseline text-xs text-orange-500" aria-hidden />
              {person.quote}
            </p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line/10 pt-4">
          {profile ? (
            <Link href={profile} className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">
              View profile <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
          <SocialLinks links={person.links} name={person.name} className="[&>a]:h-8 [&>a]:w-8 [&>a]:text-sm" />
        </div>
      </div>
    </article>
  );
}

// Carousel of up to 6 alumni an admin marked as "Featured" (Dashboard → Alumni → ★): 3 cards at a time on desktops,
// 2 on tablets, 1 on phones. Moves one card every AUTO_MS with a GPU transform (all photos load up front, so there's
// no waiting); the progress bar fills, then it advances. Pauses on hover / focus / touch; stays still for visitors
// who prefer reduced motion. Swipe, arrow keys, the arrows or the dots also move it.
export default function FeaturedAlumni({ alumni }) {
  const per = usePerView();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const count = alumni.length;
  const lastStart = Math.max(0, count - per);
  const start = Math.min(index, lastStart); // keeps the view full after resizing to more cards per view
  const moves = lastStart > 0;

  const go = useCallback((i) => setIndex(i > lastStart ? 0 : i < 0 ? lastStart : i), [lastStart]);
  const next = () => go(start + 1);
  const prev = () => go(start - 1);

  if (!count) return null;

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  };
  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
    if (moves && Math.abs(dx) > SWIPE_PX) (dx < 0 ? next : prev)();
    touchX.current = null;
    setPaused(false);
  };

  const arrow = 'flex h-10 w-10 items-center justify-center rounded-full border border-line/15 bg-surface text-body transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white';

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured alumni"
      className="mb-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Spotlight</p>
          <h2 className="mt-1 text-2xl font-extrabold text-ink">Featured Alumni</h2>
        </div>
        {moves && (
          <div className="flex gap-2">
            <button type="button" onClick={prev} aria-label="Previous" className={arrow}><FaChevronLeft aria-hidden /></button>
            <button type="button" onClick={next} aria-label="Next" className={arrow}><FaChevronRight aria-hidden /></button>
          </div>
        )}
      </div>

      {/* -my/py leaves room for the card lift + shadow on hover inside the clipped area */}
      <div className="-mx-2 -my-3 overflow-hidden px-2 py-3" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <ul
          className="flex gap-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [--per:1] motion-reduce:transition-none sm:[--per:2] lg:[--per:3]"
          style={{ transform: `translateX(calc(${start} * -1 * (100% + 1.5rem) / var(--per)))` }}
        >
          {alumni.map((person, i) => {
            const visible = i >= start && i < start + per;
            return (
              <li
                key={person.id}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                inert={!visible} // off-screen cards: hidden from screen readers and the Tab key
                className="shrink-0"
                style={{ flexBasis: 'calc((100% - (var(--per) - 1) * 1.5rem) / var(--per))' }}
              >
                <AlumniSlide person={person} />
              </li>
            );
          })}
        </ul>
      </div>

      {/* One dot per position; the active one fills for AUTO_MS, then the carousel moves on */}
      {moves && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: lastStart + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show from ${alumni[i].name}`}
              aria-current={i === start ? 'true' : undefined}
              className={cn('h-2 overflow-hidden rounded-full transition-all duration-300', i === start ? 'w-12 bg-orange-500/20' : 'w-2 bg-line/20 hover:bg-orange-500/50')}
            >
              {i === start && (
                <span
                  key={`fill-${start}`}
                  onAnimationEnd={next}
                  className="block h-full origin-left rounded-full bg-orange-500 motion-safe:animate-[slide-progress_linear_forwards] motion-reduce:scale-x-100"
                  style={{ animationDuration: `${AUTO_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
