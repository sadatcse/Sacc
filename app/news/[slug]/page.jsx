import { notFound } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { getPostBySlug, getRelatedPosts } from '@/server/services/news.service';
import { toCard } from '@/lib/news-utils';
import ArticleView from '@/components/news/ArticleView';
import EventView from '@/components/news/EventView';
import NewsCard from '@/components/news/NewsCard';
import { MotionRoot, Stagger, StaggerItem } from '@/components/home/motion';

// Reads MongoDB on every request so dashboard edits show up immediately
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      images: [post.cover],
      siteName: siteConfig.name,
    },
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
      <div className="min-h-[70vh] bg-canvas text-body">
        <View post={post} />

        {related.length > 0 && (
          <section className="border-t border-line/10 bg-canvas-2">
            <div className="container max-w-7xl 2xl:max-w-screen-2xl py-14">
              <h2 className="text-2xl font-bold text-ink">
                More from <span className="text-orange-500">USACC</span>
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
