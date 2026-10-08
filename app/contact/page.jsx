import { siteConfig } from '@/config/site';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import ContactForm from '@/components/forms/ContactForm';

export const metadata = { title: 'Contact Us' };

export default function Page() {
  return (
    <>
      <DarkPageHeader title="Contact" accent="Us" subtitle="Questions, collaborations or membership — send us a message." breadcrumbs={[{ label: 'Contact' }]} />
      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          <Card title="Get in touch" className="h-fit">
            <ul className="space-y-2 text-sm text-muted">
              <li>{siteConfig.contact.address}</li>
              {siteConfig.contact.email && <li>{siteConfig.contact.email}</li>}
              {siteConfig.contact.phone && <li>{siteConfig.contact.phone}</li>}
            </ul>
          </Card>
          <Card title="Send a message" className="lg:col-span-2">
            <ContactForm />
          </Card>
        </div>
      </Section>
    </>
  );
}
