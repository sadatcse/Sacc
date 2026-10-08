import DarkPageHeader from '@/components/ui/DarkPageHeader';
import NewsDirectory from '@/components/news/NewsDirectory';
import { getPublishedPosts } from '@/server/services/news.service';
import { toCard, todayISO } from '@/lib/news-utils';
import { newsCategories } from '@/data/news-categories';

export const metadata = {
  title: 'News & Events',
  description: 'Club news, articles, tutorials, research highlights and upcoming events.',
};

// Reads MongoDB on every request so dashboard edits show up immediately
export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }) {
  const { category } = await searchParams;
  const initialCategory = newsCategories.some((c) => c.key === category) ? category : '';
  // Rendered per request (reads ?category=), so Upcoming / Completed is always current
  const today = todayISO();
  const posts = (await getPublishedPosts()).map((post) => toCard(post, today));

  return (
    <div className="min-h-[70vh] bg-canvas text-body">
      <DarkPageHeader
        title="News &"
        accent="Events"
        subtitle="Announcements, articles, tutorials and research from the club — plus every workshop, contest and seminar we run."
        breadcrumbs={[{ label: 'News' }]}
      />

      <section className="container max-w-7xl 2xl:max-w-screen-2xl py-10 md:py-12">
        <NewsDirectory posts={posts} initialCategory={initialCategory} />
      </section>
    </div>
  );
}
