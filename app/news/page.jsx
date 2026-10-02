import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Section from '@/components/ui/Section';
import Placeholder from '@/components/ui/Placeholder';

export const metadata = { title: 'Our News' };

// Replace with real posts (e.g. from the database) when ready.
const SAMPLE_SLUGS = ['news-one', 'news-two', 'news-three'];

export default function Page() {
  return (
    <>
      <PageHeader title="Our News" subtitle="Updates, announcements and event recaps." breadcrumbs={[{ label: 'News' }]} />
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {SAMPLE_SLUGS.map((slug) => (
            <Link key={slug} href={`/news/${slug}`} className="block">
              <Placeholder label={`News card → /news/${slug}`} />
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
