import PageHeader from '@/components/ui/PageHeader';
import Container from '@/components/ui/Container';
import Placeholder from '@/components/ui/Placeholder';

// Shared layout for every /legal page. Pass `sections` = [{ heading, body }] when the text is ready.
export default function LegalPage({ title, lastUpdated, sections = [] }) {
  return (
    <>
      <PageHeader title={title} breadcrumbs={[{ label: 'Legal' }, { label: title }]} subtitle={lastUpdated ? `Last updated: ${lastUpdated}` : undefined} />
      <Container className="max-w-3xl py-12">
        {sections.length === 0 ? (
          <Placeholder label={`${title} content goes here`} />
        ) : (
          <div className="space-y-8">
            {sections.map((s) => (
              <section key={s.heading}>
                <h2 className="mb-2 text-xl">{s.heading}</h2>
                <p className="leading-relaxed text-gray-600">{s.body}</p>
              </section>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
