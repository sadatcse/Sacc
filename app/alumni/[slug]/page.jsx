import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-guard';
import {
  FaEnvelope, FaMapMarkerAlt, FaBriefcase, FaGraduationCap,
  FaTrophy, FaQuoteLeft, FaHandsHelping, FaArrowLeft, FaUserGraduate, FaPhoneAlt, FaWhatsapp,
} from 'react-icons/fa';
import { siteConfig } from '@/config/site';
import { formatPhone } from '@/lib/utils';
import { getAlumniBySlug, getRelatedAlumni } from '@/server/services/alumni.service';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import SocialLinks from '@/components/ui/SocialLinks';
import { AlumniCard } from '@/components/alumni/AlumniDirectory';
import { MotionRoot, Reveal, Stagger, StaggerItem } from '@/components/home/motion';

// Reads MongoDB on every request so profile edits show up immediately
export const dynamic = 'force-dynamic';

const SHIFT = { day: 'Day', evening: 'Evening' };
const panel = 'rounded-2xl border border-line/10 bg-surface/70 p-6';

const initials = (name = '') => name.split(/\s+/).filter((w) => w && !w.endsWith('.')).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = await getAlumniBySlug(slug);
  if (!a) return { title: 'Alumni not found' };
  const role = [a.jobTitle, a.company].filter(Boolean).join(' at ');
  return {
    title: `${a.name} — Alumni`,
    description: `${a.name}${role ? `, ${role}` : ''}${a.batch ? ` · ${a.batch}` : ''} — ${siteConfig.name} alumni.`,
    ...(a.photo && { openGraph: { images: [a.photo] } }),
  };
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h2 className="mb-5 flex items-center gap-3 text-xl text-ink">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400"><Icon aria-hidden /></span>
      {children}
    </h2>
  );
}

function Fact({ label, children }) {
  if (!children) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-line/5 py-2.5 text-sm last:border-0">
      <dt className="text-subtle">{label}</dt>
      <dd className="text-right font-medium text-ink-2">{children}</dd>
    </div>
  );
}

// Members only: signed-out visitors go to /login and come back here afterwards (also enforced in proxy.js)
export default async function Page({ params }) {
  const { slug } = await params;
  if (!(await getServerSession())) redirect(`/login?from=${encodeURIComponent(`/alumni/${slug}`)}`);
  const a = await getAlumniBySlug(slug);
  if (!a) notFound();

  const related = await getRelatedAlumni(a);
  const place = [a.location, a.country].filter(Boolean).join(', ');
  const chips = [a.batch, a.shift && `${SHIFT[a.shift]} shift`, a.graduationYear && `Class of ${a.graduationYear}`].filter(Boolean);
  const hasStory = a.bio || a.quote || a.experience?.length || a.education?.length || a.achievements?.length;

  return (
    <MotionRoot>
      <div className="min-h-[70vh] bg-canvas text-body">
        <DarkPageHeader breadcrumbs={[{ label: 'Alumni', href: '/alumni' }, { label: a.name }]}>
          <Reveal y={20} className="mt-2 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="shrink-0 rounded-full bg-gradient-to-br from-red-600 to-orange-500 p-1 shadow-[0_0_40px_-8px_rgba(249,115,22,0.7)]">
              {a.photo ? (
                <Image unoptimized src={a.photo} alt={a.name} width={144} height={144} className="h-32 w-32 rounded-full object-cover object-top sm:h-36 sm:w-36" priority />
              ) : (
                <span className="flex h-32 w-32 items-center justify-center rounded-full bg-surface text-4xl font-bold text-ink sm:h-36 sm:w-36">{initials(a.name)}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold text-ink md:text-4xl">{a.name}</h1>
              {(a.jobTitle || a.company) && (
                <p className="mt-2 text-lg text-ink-2">
                  {a.jobTitle}
                  {a.company && <> <span className="text-orange-500">@</span> {a.company}</>}
                </p>
              )}
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {chips.map((c) => <span key={c} className="rounded-full border border-line/15 px-3 py-1 text-xs font-medium text-body">{c}</span>)}
                {place && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line/15 px-3 py-1 text-xs font-medium text-body">
                    <FaMapMarkerAlt className="text-orange-500" aria-hidden /> {place}
                  </span>
                )}
                {a.featured && <span className="rounded-full border border-orange-500/60 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">{a.featured}</span>}
                {a.openToMentor && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <FaHandsHelping aria-hidden /> Open to mentoring
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <SocialLinks links={a.links} name={a.name} exclude={['email']} />
                {a.links?.email && (
                  <a href={`mailto:${a.links.email}`} className="inline-flex h-9 items-center gap-2 rounded-md bg-gradient-to-r from-red-600 to-orange-500 px-3 text-sm font-semibold text-white">
                    <FaEnvelope aria-hidden /> Email
                  </a>
                )}
                {a.phone && (
                  <>
                    <a href={`tel:${a.phone.replace(/[^\d+]/g, '')}`} className="inline-flex h-9 items-center gap-2 rounded-md border border-line/10 px-3 text-sm font-semibold text-body hover:border-orange-500">
                      <FaPhoneAlt aria-hidden /> {formatPhone(a.phone)}
                    </a>
                    <a
                      href={`https://wa.me/${a.phone.replace(/\D/g, '').replace(/^0(?=1)/, '880')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <FaWhatsapp aria-hidden /> WhatsApp
                    </a>
                  </>
                )}
              </div>
            </div>
          </Reveal>
        </DarkPageHeader>

        <div className="container max-w-6xl py-10 md:py-14 2xl:max-w-7xl">
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-6">
              {a.bio && (
                <Reveal className={panel}>
                  <SectionTitle icon={FaUserGraduate}>About</SectionTitle>
                  <p className="whitespace-pre-line leading-relaxed text-body">{a.bio}</p>
                </Reveal>
              )}

              {a.quote && (
                <Reveal className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-surface to-red-500/10 p-6">
                  <FaQuoteLeft className="absolute right-5 top-5 text-4xl text-orange-500/20" aria-hidden />
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Message to students</p>
                  <blockquote className="mt-3 text-lg italic leading-relaxed text-ink-2">“{a.quote}”</blockquote>
                </Reveal>
              )}

              {a.experience?.length > 0 && (
                <Reveal className={panel}>
                  <SectionTitle icon={FaBriefcase}>Experience</SectionTitle>
                  <ol className="relative space-y-6 border-l border-line/15 pl-6">
                    {a.experience.map((job, i) => (
                      <li key={`${job.title}-${job.company}-${i}`} className="relative">
                        <span className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-surface ${i === 0 && !job.end ? 'bg-orange-500' : 'bg-line/30'}`} aria-hidden />
                        <h3 className="font-semibold text-ink">{job.title}</h3>
                        <p className="text-sm text-body">
                          {job.company}
                          {job.location && <span className="text-subtle"> · {job.location}</span>}
                        </p>
                        {(job.start || job.end) && <p className="mt-0.5 text-xs text-subtle">{job.start || '—'} – {job.end || 'Present'}</p>}
                        {job.description && <p className="mt-2 text-sm leading-relaxed text-muted">{job.description}</p>}
                      </li>
                    ))}
                  </ol>
                </Reveal>
              )}

              {a.education?.length > 0 && (
                <Reveal className={panel}>
                  <SectionTitle icon={FaGraduationCap}>Education</SectionTitle>
                  <ul className="space-y-4">
                    {a.education.map((ed, i) => (
                      <li key={`${ed.degree}-${i}`} className="flex flex-col justify-between gap-1 border-b border-line/5 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-start">
                        <div>
                          <h3 className="font-semibold text-ink">{ed.degree}</h3>
                          <p className="text-sm text-body">{ed.institution}</p>
                        </div>
                        {(ed.start || ed.end) && <span className="shrink-0 text-xs text-subtle">{[ed.start, ed.end].filter(Boolean).join(' – ')}</span>}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}

              {a.achievements?.length > 0 && (
                <Reveal className={panel}>
                  <SectionTitle icon={FaTrophy}>Achievements</SectionTitle>
                  <ul className="space-y-2.5">
                    {a.achievements.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-relaxed text-body">
                        <FaTrophy className="mt-1 shrink-0 text-xs text-orange-500" aria-hidden /> {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}

              {!hasStory && (
                <div className={`${panel} text-center text-sm text-muted`}>{a.name.split(' ')[0]} hasn’t added their story yet.</div>
              )}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24">
              <Reveal x={20} y={0} className={panel}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-subtle">Quick facts</h2>
                <dl>
                  <Fact label="Batch">{a.batch}</Fact>
                  <Fact label="Shift">{SHIFT[a.shift]}</Fact>
                  <Fact label="Department">{a.department}</Fact>
                  <Fact label="Degree">{a.degree}</Fact>
                  <Fact label="Graduated">{a.graduationYear}</Fact>
                  <Fact label="Industry">{a.industry}</Fact>
                  <Fact label="Based in">{place}</Fact>
                </dl>
              </Reveal>

              {a.skills?.length > 0 && (
                <Reveal x={20} y={0} className={panel}>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-subtle">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {a.skills.map((s) => <span key={s} className="rounded-full bg-line/5 px-3 py-1 text-xs font-medium text-ink-2">{s}</span>)}
                  </div>
                </Reveal>
              )}

              {a.openToMentor && (
                <Reveal x={20} y={0} className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
                  <FaHandsHelping className="text-2xl text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <h2 className="mt-3 text-base text-ink">Looking for guidance?</h2>
                  <p className="mt-1 text-sm text-muted">{a.name.split(' ')[0]} is happy to mentor current students on careers and higher studies.</p>
                  <Link
                    href={a.links?.email ? `mailto:${a.links.email}` : '/contact'}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    {a.links?.email ? 'Send an email' : 'Ask the club to connect you'}
                  </Link>
                </Reveal>
              )}
            </aside>
          </div>

          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="text-2xl font-bold text-ink">
                More <span className="text-orange-500">alumni</span>
              </h2>
              <span className="mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-red-600 to-orange-500" />
              <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((p) => (
                  <StaggerItem key={p.id}>
                    <AlumniCard person={p} signedIn />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          )}

          <Link href="/alumni" className="mt-12 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-orange-600 dark:hover:text-orange-400">
            <FaArrowLeft className="text-xs" aria-hidden /> Back to the Alumni Directory
          </Link>
        </div>
      </div>
    </MotionRoot>
  );
}
