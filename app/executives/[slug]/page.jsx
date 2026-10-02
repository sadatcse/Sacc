import Image from 'next/image';
import { notFound } from 'next/navigation';
import { FaLinkedinIn, FaGithub, FaFacebookF, FaEnvelope } from 'react-icons/fa';
import { siteConfig } from '@/config/site';
import { getLatestYear, getPerson, getPersonSlugs, getPositionsFor } from '@/lib/executives';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import { initials } from '@/components/executives/ExecutiveCard';
import RoleIcon from '@/components/executives/RoleIcon';
import { Counter, MotionRoot, Reveal, Stagger, StaggerItem } from '@/components/home/motion';

const LINKS = [
  ['linkedin', FaLinkedinIn, 'LinkedIn'],
  ['github', FaGithub, 'GitHub'],
  ['facebook', FaFacebookF, 'Facebook'],
  ['email', FaEnvelope, 'Email'],
];

export function generateStaticParams() {
  return getPersonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) return { title: 'Executive not found' };
  const [latest] = getPositionsFor(slug);
  return {
    title: person.name,
    description: latest ? `${person.name} — ${latest.role}, ${siteConfig.name} ${latest.year}.` : person.name,
  };
}

export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) notFound();

  const history = getPositionsFor(slug);
  const [latest] = history;
  const currentYear = getLatestYear();
  const requestedYear = Number((await searchParams).year);
  const crumbYear = history.some((p) => p.year === requestedYear) ? requestedYear : latest?.year;

  const stats = [
    { label: 'Total Positions Held', value: history.length },
    { label: 'Years Active', value: new Set(history.map((p) => p.year)).size },
    { label: 'Different Role Types', value: new Set(history.map((p) => p.role)).size },
  ];
  const isAdvisor = latest?.type === 'advisor';
  const links = LINKS.filter(([key]) => person.links?.[key]);

  return (
    <MotionRoot>
      <div className="min-h-[70vh] bg-black text-neutral-300">
        <DarkPageHeader
          breadcrumbs={[
            { label: 'Executives', href: '/executives' },
            ...(crumbYear ? [{ label: String(crumbYear), href: `/executives?year=${crumbYear}` }] : []),
            { label: person.name },
          ]}
        />

        <div className="container max-w-7xl py-12">
          {/* Profile header */}
          <Reveal className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="shrink-0 rounded-full bg-gradient-to-br from-red-600 to-orange-500 p-1 shadow-[0_0_40px_-8px_rgba(249,115,22,0.7)]">
              {person.photo ? (
                <Image src={person.photo} alt={person.name} width={144} height={144} className="h-36 w-36 rounded-full object-cover object-top" priority />
              ) : (
                <span className="flex h-36 w-36 items-center justify-center rounded-full bg-neutral-900 text-4xl font-bold text-white">
                  {initials(person.name)}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white md:text-4xl">{person.name}</h1>
              {latest && (
                <p className="mt-2 text-lg text-neutral-200 md:text-xl">
                  <span className="text-orange-400">{latest.role}</span>, {siteConfig.name} {latest.year}
                </p>
              )}
              <p className="mt-1 text-sm text-neutral-400">
                {isAdvisor ? person.department || 'Faculty' : 'University of South Asia'}
                {person.studentId && <> · Student ID: {person.studentId}</>}
              </p>
              {links.length > 0 && (
                <div className="mt-4 flex justify-center gap-2 sm:justify-start">
                  {links.map(([key, Icon, label]) => {
                    const href = key === 'email' ? `mailto:${person.links.email}` : person.links[key];
                    return (
                      <a
                        key={key}
                        href={href}
                        {...(key !== 'email' && { target: '_blank', rel: 'noopener noreferrer' })}
                        aria-label={`${person.name} — ${label}`}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-neutral-300 transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
                      >
                        <Icon aria-hidden />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </Reveal>

          {/* Positions timeline */}
          <h2 className="mb-6 mt-14 text-xl text-white md:text-2xl">Executive Positions</h2>
          <Stagger className="space-y-4">
            {history.map((pos) => {
              const isCurrent = pos.year === currentYear;
              return (
                <StaggerItem key={`${pos.year}-${pos.role}`}>
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-neutral-900/70 p-5 transition-colors hover:border-orange-500/60">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <RoleIcon role={pos.role} className="text-orange-500" /> {pos.role}
                      </h3>
                      <p className="mt-2 text-sm text-neutral-400">
                        <span className="font-semibold text-neutral-300">Year:</span> {pos.year}
                        <span className="mx-3 text-neutral-700">|</span>
                        <span className="font-semibold text-neutral-300">Type:</span> {pos.type === 'advisor' ? 'Faculty Advisor' : 'Student Executive'}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-white">
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
                <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-6 text-center">
                  <p className="text-3xl font-bold text-orange-400">
                    <Counter value={stat.value} />
                  </p>
                  <p className="mt-1 text-sm text-neutral-400">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </MotionRoot>
  );
}
