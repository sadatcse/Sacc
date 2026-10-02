import PageHeader from '@/components/ui/PageHeader';
import Container from '@/components/ui/Container';
import Placeholder from '@/components/ui/Placeholder';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `News: ${slug}` };
}

export default async function Page({ params }) {
  const { slug } = await params;
  return (
    <>
      <PageHeader title="News Details" subtitle={`Article: ${slug}`} breadcrumbs={[{ label: 'News', href: '/news' }, { label: slug }]} />
      <Container className="max-w-3xl space-y-6 py-12">
        <Placeholder label="Cover image" className="min-h-[240px]" />
        <Placeholder label="Article body" className="min-h-[320px]" />
      </Container>
    </>
  );
}
