import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaExternalLinkAlt, FaRegBuilding, FaRegCalendarAlt, FaRegClock, FaRegUser } from 'react-icons/fa';
import { FiMapPin } from 'react-icons/fi';
import { eventStatus } from '@/lib/news-utils';
import { categoryLabel } from '@/data/news-categories';
import { formatCalendarDate } from '@/lib/utils';
import RichText from '@/components/news/RichText';
import ShareButton from '@/components/news/ShareButton';
import { CategoryBadge, StatusBadge } from '@/components/news/NewsCard';
import { Reveal } from '@/components/home/motion';

const panel = 'rounded-2xl border border-line/10 bg-surface/70 p-6';

// Event layout for type: 'event' — cover, about + guests, and a details sidebar
export default function EventView({ post }) {
  const { event } = post;
  const status = eventStatus(post);
  const { registered, capacity } = event.participants || {};
  const fill = capacity ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
  const isFull = capacity && registered >= capacity;

  const details = [
    [FaRegCalendarAlt, formatCalendarDate(event.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
    [FaRegClock, event.time],
    [FiMapPin, event.venue],
  ].filter(([, text]) => text);

  return (
    <article className="container max-w-5xl py-10 md:py-14">
      <Link href="/news" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-orange-600 dark:hover:text-orange-400">
        <FaArrowLeft className="text-xs" aria-hidden /> Back to events
      </Link>

      <Reveal y={20}>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Link href={`/news?category=${post.category}`} className="transition-opacity hover:opacity-90">
            <CategoryBadge>{categoryLabel(post.category)}</CategoryBadge>
          </Link>
          <StatusBadge status={status} />
        </div>
        <h1 className="mt-4 max-w-4xl text-3xl font-extrabold leading-tight text-ink md:text-5xl">{post.title}</h1>
        {event.organizer && (
          <p className="mt-3 flex items-center gap-2 text-muted md:text-lg">
            <FaRegBuilding className="shrink-0 text-orange-500" aria-hidden /> {event.organizer}
          </p>
        )}
      </Reveal>

      <Reveal y={30} delay={0.1} className="mt-8">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-line/10 md:aspect-[2.2/1]">
          <Image src={post.cover} alt={post.title} fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
        </div>
      </Reveal>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Reveal className={panel}>
            <h2 className="mb-4 text-2xl font-bold text-ink">About the Event</h2>
            <RichText blocks={post.body} />
          </Reveal>

          {event.guests?.length > 0 && (
            <Reveal className={panel}>
              <h2 className="flex items-center gap-3 border-b border-line/10 pb-4 text-xl font-bold text-ink">
                <FaRegUser className="text-orange-500" aria-hidden /> Honorable Guests
              </h2>
              <div className="mt-5 space-y-4">
                {event.guests.map((group) => (
                  <div key={group.group} className="rounded-xl border border-line/10 bg-canvas-2/60 p-4">
                    <h3 className="font-semibold text-ink">{group.group}</h3>
                    <ul className="mt-3 space-y-3">
                      {group.people.map((person) => (
                        <li key={person.name}>
                          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{person.title}</p>
                          <p className="text-sm text-muted">{person.name}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        <Reveal x={20} y={0} className={`${panel} lg:sticky lg:top-24`}>
          <ul className="space-y-4">
            {details.map(([Icon, text]) => (
              <li key={text} className="flex items-start gap-3 text-ink-2">
                <Icon className="mt-1 shrink-0 text-lg text-orange-500" aria-hidden />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          {capacity > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink-2">Participants</span>
                <span className="text-muted">{registered} / {capacity}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-line/10" role="progressbar" aria-valuenow={registered} aria-valuemin={0} aria-valuemax={capacity} aria-label="Seats filled">
                <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-500" style={{ width: `${fill}%` }} />
              </div>
              <p className="mt-2 text-xs text-subtle">
                {status === 'past' ? `${fill}% of seats were filled` : isFull ? 'All seats are taken' : `${capacity - registered} seats left`}
              </p>
            </div>
          )}

          {event.link && (
            <a
              href={event.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-transform hover:scale-[1.02]"
            >
              {event.link.label} <FaExternalLinkAlt className="text-xs" aria-hidden />
            </a>
          )}
          <div className="mt-4 flex justify-center">
            <ShareButton title={post.title} />
          </div>
        </Reveal>
      </div>
    </article>
  );
}
