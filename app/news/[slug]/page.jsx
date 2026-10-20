import { notFound } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { getPostBySlug, getRelatedPosts } from '@/server/services/news.service';
import { toCard } from '@/lib/news-utils';
import ArticleView from '@/components/news/ArticleView';
import EventView from '@/components/news/EventView';
import NewsCard from '@/components/news/NewsCard';
import { MotionRoot, Stagger, StaggerItem } from '@/components/home/motion';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_URL, absoluteUrl, describe } from '@/lib/seo';

// Reads MongoDB on every request so dashboard edits show up immediately
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post not found' };
  const description = describe(post.excerpt || post.title);
  const images = post.cover ? [{ url: absoluteUrl(post.cover), alt: post.title }] : undefined;
  return {
    title: post.title,
    description,
    keywords: post.tags,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: `/news/${post.slug}`,
      publishedTime: post.date,
      modifiedTime: post.updatedAt,
      ...(post.author?.name && { authors: [post.author.name] }),
      tags: post.tags,
      images,
      siteName: siteConfig.name,
    },
    twitter: { card: 'summary_large_image', title: post.title, description, images },
  };
}

// schema.org data: events as Event (date, place, organizer), everything else as NewsArticle
function postSchema(post) {
  const url = `${SITE_URL}/news/${post.slug}`;
  const image = post.cover ? [absoluteUrl(post.cover)] : undefined;
  const publisher = { '@type': 'Organization', name: siteConfig.name, logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') } };
  if (post.type === 'event' && post.event?.date) {
    return {
      '@type': 'Event',
      name: post.title,
      description: describe(post.excerpt || post.title, 300),
      url,
      image,
      startDate: post.event.date,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: post.event.venue || 'University of South Asia', address: { '@type': 'PostalAddress', addressLocality: 'Dhaka', addressCountry: 'BD' } },
      organizer: { '@type': 'Organization', name: post.event.organizer || siteConfig.name, url: SITE_URL },
    };
  }
  return {
    '@type': 'NewsArticle',
    headline: post.title.slice(0, 110),
    description: describe(post.excerpt || post.title, 300),
    image,
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    author: post.author?.name ? { '@type': 'Person', name: post.author.name } : publisher,
    publisher,
    mainEntityOfPage: url,
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = (await getRelatedPosts(post)).map((p) => toCard(p));
  const View = post.type === 'event' ? EventView : ArticleView;

  return (
    <MotionRoot>
      <JsonLd data={postSchema(post)} />
      <div className="min-h-[70vh] bg-canvas text-body">
        <View post={post} />

        {related.length > 0 && (
          <section className="border-t border-line/10 bg-canvas-2">
            <div className="container max-w-7xl 2xl:max-w-screen-2xl py-14">
              <h2 className="text-2xl font-bold text-ink">
                More from <span className="text-orange-500">{siteConfig.shortName}</span>
              </h2>
              <span className="mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-red-600 to-orange-500" />
              <Stagger className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <StaggerItem key={p.slug}>
                    <NewsCard post={p} />
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </section>
        )}
      </div>
    </MotionRoot>
  );
}
