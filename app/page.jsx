import { Suspense } from 'react';
import Hero from '@/components/home/Hero';
import { HomeSectionSkeleton } from '@/components/loading/PageSkeletons';
import { MotionRoot } from '@/components/home/motion';
import {
  AboutSection, WhatWeDoSection, TechAndProjectsSection, EventsSection, AchievementsSection,
  WorkshopsSection, ExecutivesSection, CommunitySection, ConnectSection,
} from '@/components/home/Sections';
import JsonLd from '@/components/seo/JsonLd';
import { getContactInfo } from '@/server/services/settings.service';
import { SITE_URL, organizationSchema } from '@/lib/seo';
import { siteConfig } from '@/config/site';

// Events, news, committee and gallery come from MongoDB; everything else lives in src/data/home.js.
// Each database section streams in behind its own placeholder, so the hero and the static sections show at once
// even on a slow connection or a slow database.
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
        <Suspense fallback={<HomeSectionSkeleton className="bg-canvas-2" label="Loading events…" />}>
          <EventsSection />
        </Suspense>
        <Suspense fallback={<HomeSectionSkeleton count={5} columns={5} label="Loading achievements…" />}>
          <AchievementsSection />
        </Suspense>
        <Suspense fallback={<HomeSectionSkeleton className="bg-canvas-2" label="Loading workshops…" />}>
          <WorkshopsSection />
        </Suspense>
        <Suspense fallback={<HomeSectionSkeleton count={5} columns={5} round label="Loading committee…" />}>
          <ExecutivesSection />
        </Suspense>
        <Suspense fallback={<HomeSectionSkeleton className="bg-canvas-2" count={3} columns={3} label="Loading…" />}>
          <CommunitySection />
        </Suspense>
        <Suspense fallback={<HomeSectionSkeleton count={3} columns={3} label="Loading contacts…" />}>
          <ConnectSection />
        </Suspense>
      </div>
    </MotionRoot>
  );
}
