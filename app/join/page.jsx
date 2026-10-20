import DarkPageHeader from '@/components/ui/DarkPageHeader';
import JoinForm from '@/components/join/JoinForm';
import { getPaymentMethods, getSetting } from '@/server/services/settings.service';
import { methodsFor } from '@/config/payment-methods';
import { siteConfig } from '@/config/site';

export const metadata = {
  alternates: { canonical: '/join' },
  title: 'Join the Club',
  description: `Apply for membership of the ${siteConfig.name}.`,
};

// Open/closed and fee come from Dashboard → Membership; payment methods from Dashboard → Payment Methods
export const dynamic = 'force-dynamic';

export default async function Page() {
  const [settings, methods] = await Promise.all([getSetting('membership'), getPaymentMethods()]);

  return (
    <div className="min-h-[70vh] bg-canvas text-body">
      <DarkPageHeader
        title="Join"
        accent="South Asia Computer Club"
        subtitle="Be part of the most dynamic tech community at the University of South Asia. Fill in the form — an admin will review your application."
        breadcrumbs={[{ label: 'Join Us' }]}
      />
      <section className="container max-w-7xl 2xl:max-w-screen-2xl py-10 md:py-14">
        <JoinForm settings={settings} methods={methodsFor(methods, 'membership')} />
      </section>
    </div>
  );
}
