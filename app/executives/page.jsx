import { FaUserGraduate, FaUsers } from 'react-icons/fa';
import { siteConfig } from '@/config/site';
import { getCommittee, getLatestYear, getYears } from '@/lib/executives';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import YearTabs from '@/components/executives/YearTabs';
import ExecutiveCard from '@/components/executives/ExecutiveCard';
import { MotionRoot, Stagger, StaggerItem } from '@/components/home/motion';

function resolveYear(value) {
  const year = Number(value);
  return getYears().includes(year) ? year : getLatestYear();
}

export async function generateMetadata({ searchParams }) {
  const year = resolveYear((await searchParams).year);
  return {
    title: `Executives ${year}`,
    description: `The ${year} executive committee of the ${siteConfig.name} — faculty advisors and student executives.`,
  };
}

function Group({ icon: Icon, title, members }) {
  if (!members.length) return null;
  return (
    <section className="mt-12 first:mt-0">
      <h2 className="mb-6 flex items-center gap-3 text-xl text-white md:text-2xl">
        <Icon className="text-orange-500" aria-hidden /> {title}
      </h2>
      <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" gap={0.05}>
        {members.map((member) => (
          <StaggerItem key={`${member.slug}-${member.role}`}>
            <ExecutiveCard member={member} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

// /executives?year=2025 — defaults to the newest committee
export default async function Page({ searchParams }) {
  const years = getYears();
  const year = resolveYear((await searchParams).year);
  const { advisors, executives } = getCommittee(year);

  return (
    <MotionRoot>
      <div className="min-h-[70vh] bg-black text-neutral-300">
        <DarkPageHeader
          title={`${siteConfig.shortName} Executives`}
          accent={year}
          subtitle={`The ${year} executive committee of the ${siteConfig.name} — faculty advisors and student executives of the University of South Asia.`}
          breadcrumbs={[{ label: 'Executives', href: '/executives' }, { label: String(year) }]}
        >
          <YearTabs years={years} active={year} />
        </DarkPageHeader>

        {/* key={year} replays the entrance animation when switching years */}
        <div key={year} className="container max-w-7xl py-12">
          <Group icon={FaUserGraduate} title="Faculty Advisors" members={advisors} />
          <Group icon={FaUsers} title="Student Executives" members={executives} />
        </div>
      </div>
    </MotionRoot>
  );
}
