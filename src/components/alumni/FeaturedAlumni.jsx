'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaQuoteLeft, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { cn } from '@/lib/utils';

const AUTO_MS = 5000;

function Slide({ person }) {
  const inner = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-surface-2 to-surface">
        {person.photo ? (
          <Image unoptimized src={person.photo} alt={person.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <span className="flex h-full items-center justify-center text-6xl font-bold text-orange-600/70 dark:text-orange-400/70">{person.name.charAt(0)}</span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-16">
          <p className="text-lg font-bold text-white">{person.name}</p>
          <p className="text-sm text-neutral-200">
            {person.role}
            {person.company && <> <span className="text-orange-400">@</span> {person.company}</>}
          </p>
        </div>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
          <FaStar aria-hidden /> Featured
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {person.batch && <span className="rounded border border-line/15 px-1.5 py-0.5 font-semibold text-body">{person.batch}</span>}
          {person.featured && <span className="rounded border border-orange-500/60 bg-orange-500/10 px-1.5 py-0.5 font-semibold text-orange-600 dark:text-orange-400">{person.featured}</span>}
          {person.location && <span className="inline-flex items-center gap-1"><FaMapMarkerAlt aria-hidden className="text-[10px]" /> {person.location}</span>}
        </div>
        {person.quote && (
          <p className="mt-3 line-clamp-3 text-sm italic text-body">
            <FaQuoteLeft className="mr-1.5 inline text-xs text-orange-500" aria-hidden />
            {person.quote}
          </p>
        )}
      </div>
    </>
  );
  const card = 'group flex h-full flex-col overflow-hidden rounded-2xl border border-line/10 bg-surface transition-colors hover:border-orange-500/60';
  return person.slug ? <Link href={`/alumni/${person.slug}`} className={card}>{inner}</Link> : <div className={card}>{inner}</div>;
}

// Slideshow of up to 6 alumni an admin marked as "Featured" (Dashboard → Alumni → ★).
// One card per view on phones, two on tablets, three on desktops; auto-advances, pauses on hover / focus.
export default function FeaturedAlumni({ alumni }) {
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = alumni.length;

  // Cards per view = how many fit in the track
  const perView = useCallback(() => {
    const el = track.current;
    const card = el?.firstElementChild;
    return el && card ? Math.max(1, Math.round(el.clientWidth / card.clientWidth)) : 1;
  }, []);
  const lastStart = useCallback(() => Math.max(0, count - perView()), [count, perView]);

  const goTo = useCallback(
    (i) => {
      const el = track.current;
      if (!el) return;
      const target = i > lastStart() ? 0 : i < 0 ? lastStart() : i;
      el.scrollTo({ left: el.children[target]?.offsetLeft - el.firstElementChild.offsetLeft, behavior: 'smooth' });
    },
    [lastStart]
  );

  // Keep the dots in sync with manual swiping
  const onScroll = () => {
    const el = track.current;
    const card = el?.firstElementChild;
    if (card) setIndex(Math.round(el.scrollLeft / (card.clientWidth + parseFloat(getComputedStyle(el).columnGap || 0))));
  };

  useEffect(() => {
    if (paused || count <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => goTo(index + 1), AUTO_MS);
    return () => clearInterval(id);
  }, [paused, index, count, goTo]);

  if (!count) return null;

  const arrow = 'flex h-10 w-10 items-center justify-center rounded-full border border-line/15 bg-surface text-body transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white';
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured alumni"
      className="mb-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Spotlight</p>
          <h2 className="mt-1 text-2xl font-extrabold text-ink">Featured Alumni</h2>
        </div>
        {count > 1 && (
          <div className="flex gap-2">
            <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous" className={arrow}><FaChevronLeft aria-hidden /></button>
            <button type="button" onClick={() => goTo(index + 1)} aria-label="Next" className={arrow}><FaChevronRight aria-hidden /></button>
          </div>
        )}
      </div>

      <ul
        ref={track}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {alumni.map((person, i) => (
          <li key={person.id} aria-roledescription="slide" aria-label={`${i + 1} of ${count}`} className="w-full shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc((100%-2rem)/3)]">
            <Slide person={person} />
          </li>
        ))}
      </ul>

      {count > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {alumni.map((person, i) => (
            <button
              key={person.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${person.name}`}
              aria-current={i === index ? 'true' : undefined}
              className={cn('h-2 rounded-full transition-all', i === index ? 'w-6 bg-orange-500' : 'w-2 bg-line/20 hover:bg-orange-500/50')}
            />
          ))}
        </div>
      )}
    </section>
  );
}
