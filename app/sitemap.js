import { siteConfig } from '@/config/site';
import { mainNav, legalNav } from '@/config/navigation';
import { getPublishedPosts } from '@/server/services/news.service';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const pages = [...mainNav, ...legalNav].map((route) => ({
    url: `${siteConfig.url}${route.href === '/' ? '' : route.href}`,
    lastModified: new Date(),
    changeFrequency: route.href.startsWith('/legal') ? 'yearly' : 'weekly',
    priority: route.href === '/' ? 1 : route.href.startsWith('/legal') ? 0.3 : 0.7,
  }));
  // Sitemap still works (without posts) if the database is unreachable
  const posts = await getPublishedPosts().catch(() => []);
  const news = posts.map((post) => ({
    url: `${siteConfig.url}/news/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
  return [...pages, ...news];
}
