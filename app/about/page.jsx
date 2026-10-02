import PageHeader from '@/components/ui/PageHeader';
import Section from '@/components/ui/Section';
import Placeholder from '@/components/ui/Placeholder';

export const metadata = { title: 'About' };

export default function Page() {
  return (
    <>
      <PageHeader title="About" subtitle="Who we are, our mission and what we do." breadcrumbs={[{ label: 'About' }]} />
      <Section>
        <Placeholder label="About content goes here" />
      </Section>
    </>
  );
}
