import Image from 'next/image';
import { notFound } from 'next/navigation';
import { FaEnvelope, FaPhoneAlt, FaUniversity, FaIdBadge, FaBuilding } from 'react-icons/fa';
import { siteConfig } from '@/config/site';
import { getLatestYear, getPerson, getPositionsFor } from '@/server/services/executive.service';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import SocialLinks from '@/components/ui/SocialLinks';
import { initials } from '@/components/executives/ExecutiveCard';
import RoleIcon from '@/components/executives/RoleIcon';
import { Counter, MotionRoot, Reveal, Stagger, StaggerItem } from '@/components/home/motion';

// Reads MongoDB on every request so dashboard edits show up immediately
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const person = await getPerson(slug);
  if (!person) return { title: 'Executive not found' };
  const [latest] = await getPositionsFor(person._id);
  return {
    title: person.name,
    description: latest ? `${person.name} — ${latest.role}, ${siteConfig.name} ${latest.year}.` : person.name,
  };
}

export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const person = await getPerson(slug);
  if (!person) notFound();

  const history = await getPositionsFor(person._id);
  const [latest] = history;
  const currentYear = await getLatestYear();
  const requestedYear = Number((await searchParams).year);
  const crumbYear = history.some((p) => p.year === requestedYear) ? requestedYear : latest?.year;

  const stats = [
    { label: 'Total Positions Held', value: history.length },
    { label: 'Years Active', value: new Set(history.map((p) => p.year)).size },
    { label: 'Different Role Types', value: new Set(history.map((p) => p.role)).size },
  ];
  const isFaculty = person.kind === 'faculty' || (!person.kind && latest?.type === 'advisor');
  const details = (
    isFaculty
      ? [person.designation, person.department ? `Department of ${person.department.replace(/^Department of /, '')}` : 'Faculty']
      : [person.department, person.batch && `Batch ${person.batch}`, person.shift && `${person.shift === 'day' ? 'Day' : 'Evening'} shift`, person.studentId && `ID ${person.studentId}`]
  ).filter(Boolean);
  if (!details.length) details.push('University of South Asia');
  // Faculty contact details shown in a card under the header
  const facultyFacts = isFaculty
    ? [
        [FaIdBadge, 'Employee ID', person.employeeId],
        [FaUniversity, 'School', person.school],
        [FaBuilding, 'Office', person.office],
        [FaPhoneAlt, 'Office phone', person.officePhone],
        [FaEnvelope, 'Email', person.links?.email && <a href={`mailto:${person.links.email}`} className="hover:text-orange-600 dark:hover:text-orange-400">{person.links.email}</a>],
      ].filter(([, , value]) => value)
    : [];

  return (
    <MotionRoot>
      <div className="min-h-[70vh] bg-canvas text-body">
        <DarkPageHeader
          breadcrumbs={[
            { label: 'Executives', href: '/executives' },
            ...(crumbYear ? [{ label: String(crumbYear), href: `/executives?year=${crumbYear}` }] : []),
            { label: person.name },
          ]}
        />

        <div className="container max-w-7xl 2xl:max-w-screen-2xl py-12">
          {/* Profile header */}
          <Reveal className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="shrink-0 rounded-full bg-gradient-to-br from-red-600 to-orange-500 p-1 shadow-[0_0_40px_-8px_rgba(249,115,22,0.7)]">
              {person.photo ? (
                <Image unoptimized src={person.photo} alt={person.name} width={144} height={144} className="h-36 w-36 rounded-full object-cover object-top" priority />
              ) : (
                <span className="flex h-36 w-36 items-center justify-center rounded-full bg-surface text-4xl font-bold text-ink">
                  {initials(person.name)}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-ink md:text-4xl">{person.name}</h1>
              {latest && (
                <p className="mt-2 text-lg text-ink-2 md:text-xl">
                  <span className="text-orange-600 dark:text-orange-400">{latest.role}</span>, {siteConfig.name} {latest.year}
                </p>
              )}
              <p className="mt-1 text-sm text-muted">{details.join(' · ')}</p>
              <SocialLinks links={person.links} name={person.name} className="mt-4 justify-center sm:justify-start" />
            </div>
          </Reveal>

          {facultyFacts.length > 0 && (
            <Reveal className="mt-10 grid gap-3 rounded-2xl border border-line/10 bg-surface/70 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {facultyFacts.map(([Icon, label, value]) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400"><Icon aria-hidden /></span>
                  <div className="min-w-0">
                    <p className="text-xs text-subtle">{label}</p>
                    <p className="break-words text-sm font-medium text-ink-2">{value}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          )}

          {/* Positions timeline */}
          <h2 className="mb-6 mt-14 text-xl text-ink md:text-2xl">Executive Positions</h2>
          <Stagger className="space-y-4">
            {history.map((pos) => {
              const isCurrent = pos.year === currentYear;
              return (
                <StaggerItem key={`${pos.year}-${pos.role}`}>
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-line/10 bg-surface/70 p-5 transition-colors hover:border-orange-500/60">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
                        <RoleIcon role={pos.role} className="text-orange-500" /> {pos.role}
                      </h3>
                      <p className="mt-2 text-sm text-muted">
                        <span className="font-semibold text-body">Year:</span> {pos.year}
                        <span className="mx-3 text-faint">|</span>
                        <span className="font-semibold text-body">Type:</span> {pos.type === 'advisor' ? 'Faculty Advisor' : 'Student Executive'}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink">
                      <span className="relative flex h-2.5 w-2.5">
                        {isCurrent && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75" />}
                        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isCurrent ? 'bg-orange-500' : 'bg-neutral-600'}`} />
                      </span>
                      {pos.year}
                    </span>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>

          {/* Stats */}
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="rounded-xl border border-line/10 bg-surface/70 p-6 text-center">
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    <Counter value={stat.value} />
                  </p>
                  <p className="mt-1 text-sm text-muted">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </MotionRoot>
  );
}
