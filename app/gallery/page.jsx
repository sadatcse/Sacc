import PageHeader from '@/components/ui/PageHeader';
import Section from '@/components/ui/Section';
import Placeholder from '@/components/ui/Placeholder';

export const metadata = { title: 'Gallery' };

export default function Page() {
  return (
    <>
      <PageHeader title="Gallery" subtitle="Moments from our events, workshops and competitions." breadcrumbs={[{ label: 'Gallery' }]} />
      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Placeholder label="Photo" />
          <Placeholder label="Photo" />
          <Placeholder label="Photo" />
        </div>
      </Section>
    </>
  );
}
