// Pure helpers for news posts (no database) — safe on server and client.
import { categoryLabel } from '@/data/news-categories';
import { todayInTimeZone } from '@/lib/timezone';

// Plain text of a post's body (for read time and search)
function bodyText(post) {
  return (post.body || [])
    .flatMap((b) => [b.text, b.code, b.caption, ...(b.items || []), ...(b.headers || []), ...(b.rows || []).flat()])
    .filter(Boolean)
    .join(' ');
}

export function readingTime(post) {
  const words = bodyText(post).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Today in the site timezone (so events flip from upcoming to past at local midnight)
export const todayISO = () => todayInTimeZone();

// 'upcoming' | 'past' for events, null for articles. Compared by calendar day.
export function eventStatus(post, today = todayISO()) {
  if (post.type !== 'event' || !post.event?.date) return null;
  return post.event.date >= today ? 'upcoming' : 'past';
}

// Serializable card data for the client-side list (drops the full body)
export function toCard(post, today) {
  return {
    slug: post.slug,
    type: post.type,
    category: post.category,
    categoryLabel: categoryLabel(post.category),
    title: post.title,
    excerpt: post.excerpt,
    cover: post.cover,
    date: post.date,
    author: post.author,
    tags: post.tags || [],
    featured: Boolean(post.featured),
    readingTime: readingTime(post),
    event: post.event ? { date: post.event.date, time: post.event.time || '', venue: post.event.venue || '' } : null,
    status: eventStatus(post, today),
  };
}
