import Hero from '@/components/home/Hero';
import { MotionRoot } from '@/components/home/motion';
import {
  AboutSection, WhatWeDoSection, TechAndProjectsSection, EventsSection, AchievementsSection,
  WorkshopsSection, ExecutivesSection, CommunitySection, ConnectSection,
} from '@/components/home/Sections';

// Content for every section lives in src/data/home.js
export default function HomePage() {
  return (
    <MotionRoot>
      <div className="overflow-x-clip bg-black text-neutral-300">
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
