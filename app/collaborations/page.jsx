import PageHeader from '@/components/ui/PageHeader';
import Section from '@/components/ui/Section';
import Placeholder from '@/components/ui/Placeholder';

export const metadata = { title: 'Our Collaborations' };

export default function Page() {
  return (
    <>
      <PageHeader title="Our Collaborations" subtitle="Organizations and partners we work with." breadcrumbs={[{ label: 'Our Collaborations' }]} />
      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Placeholder label="Partner" />
          <Placeholder label="Partner" />
          <Placeholder label="Partner" />
        </div>
      </Section>
    </>
  );
}
