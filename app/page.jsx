import Hero from '@/components/home/Hero';
import { MotionRoot } from '@/components/home/motion';
import {
  AboutSection, WhatWeDoSection, TechAndProjectsSection, EventsSection, AchievementsSection,
  WorkshopsSection, ExecutivesSection, CommunitySection, ConnectSection,
} from '@/components/home/Sections';

// Executives come from MongoDB; everything else lives in src/data/home.js
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <MotionRoot>
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
