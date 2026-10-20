import Hero from '@/components/home/Hero';
import { MotionRoot } from '@/components/home/motion';
import {
  AboutSection, WhatWeDoSection, TechAndProjectsSection, EventsSection, AchievementsSection,
  WorkshopsSection, ExecutivesSection, CommunitySection, ConnectSection,
} from '@/components/home/Sections';
import JsonLd from '@/components/seo/JsonLd';
import { getContactInfo } from '@/server/services/settings.service';
import { SITE_URL, organizationSchema } from '@/lib/seo';
import { siteConfig } from '@/config/site';

// Executives come from MongoDB; everything else lives in src/data/home.js
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const contact = await getContactInfo();
  return (
    <MotionRoot>
      <JsonLd
        data={[
          organizationSchema(contact),
          { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: siteConfig.name, alternateName: siteConfig.shortName, publisher: { '@id': `${SITE_URL}/#organization` }, inLanguage: 'en' },
        ]}
      />
      <div className="overflow-x-clip bg-canvas text-body">
        <Hero />
        <AboutSection />
        <WhatWeDoSection />
        <TechAndProjectsSection />
        <EventsSection />
        <AchievementsSection />
        <WorkshopsSection />
        <ExecutivesSection />
        <CommunitySection />
        <ConnectSection />
      </div>
    </MotionRoot>
  );
}
