import { mainNav, legalNav } from '@/config/navigation';
import { getPublishedPosts } from '@/server/services/news.service';
import { getSitemapPeople } from '@/server/services/executive.service';
import { SITE_URL, absoluteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const PRIORITY = { '/': 1, '/news': 0.9, '/executives': 0.8, '/about': 0.8, '/join': 0.8, '/gallery': 0.7, '/alumni': 0.7, '/contact': 0.7, '/certificates': 0.5 };

// /sitemap.xml — every public page, news post (with its cover for image search) and executive profile.
// Members-only alumni profiles and private areas are left out (see app/robots.js).
export default async function sitemap() {
  const now = new Date();
  const pages = [...mainNav, { href: '/certificates' }, ...legalNav].map((route) => ({
    url: `${SITE_URL}${route.href === '/' ? '' : route.href}`,
    lastModified: now,
    changeFrequency: route.href.startsWith('/legal') ? 'yearly' : route.href === '/news' || route.href === '/' ? 'daily' : 'weekly',
    priority: PRIORITY[route.href] ?? (route.href.startsWith('/legal') ? 0.3 : 0.6),
  }));
  // The sitemap still works (pages only) if the database is unreachable
  const [posts, people] = await Promise.all([getPublishedPosts().catch(() => []), getSitemapPeople().catch(() => [])]);
  const news = posts.map((post) => ({
    url: `${SITE_URL}/news/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
    ...(post.cover && { images: [absoluteUrl(post.cover)] }),
  }));
  const executives = people.map((p) => ({
    url: `${SITE_URL}/executives/${p.slug}`,
    lastModified: new Date(p.updatedAt || now),
    changeFrequency: 'monthly',
    priority: 0.5,
    ...(p.photo && { images: [absoluteUrl(p.photo)] }),
  }));
  return [...pages, ...news, ...executives];
}
