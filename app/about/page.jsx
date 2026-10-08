import Image from 'next/image';
import { FaBullseye, FaEye, FaArrowRight, FaRegCalendarAlt, FaRegClock, FaMapMarkerAlt, FaUniversity, FaFlag } from 'react-icons/fa';
import { getSetting } from '@/server/services/settings.service';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import { HomeButton } from '@/components/home/ui';
import { Counter, MotionRoot, Reveal, Stagger, StaggerItem } from '@/components/home/motion';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'About',
  description: 'Who we are — the mission, vision and journey of the South Asia Computer Club.',
};

// Content is edited in Dashboard → About Page
export const dynamic = 'force-dynamic';

// "500+" → <Counter value={500} suffix="+" />; anything else is shown as-is
function StatValue({ value }) {
  const match = String(value).match(/^(\d+)(\D*)$/);
  return match ? <Counter value={Number(match[1])} suffix={match[2]} /> : value;
}

function MissionCard({ icon: Icon, title, text }) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-line/10 bg-gradient-to-br from-surface via-surface to-orange-500/10 p-7 transition-all duration-300 hover:border-orange-500/60 hover:shadow-[0_0_40px_-12px_rgba(249,115,22,0.6)] md:p-8">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-2xl transition-opacity group-hover:opacity-80" />
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-orange-500 text-xl text-white shadow-lg shadow-orange-500/30">
        <Icon aria-hidden />
      </span>
      <h2 className="mt-5 text-2xl font-bold text-orange-600 dark:text-orange-400">{title}</h2>
      <p className="mt-3 leading-relaxed text-body">{text}</p>
    </div>
  );
}

// "How it all started" — the club's inauguration (photo + details)
function Founding({ founding }) {
  if (!founding?.title && !founding?.text) return null;
  const facts = [
    [FaRegCalendarAlt, 'Date', founding.date],
    [FaRegClock, 'Time', founding.time],
    [FaMapMarkerAlt, 'Venue', founding.venue],
    [FaUniversity, 'Organized by', founding.organizer],
  ].filter(([, , v]) => v);
  return (
    <section className="mt-16">
      <Reveal className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
          <FaFlag aria-hidden /> Where it began
        </p>
        <h2 className="mt-3 text-3xl font-extrabold text-ink">
          How it all <span className="text-orange-500">started</span>
        </h2>
        <span className="mx-auto mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-red-600 to-orange-500" />
      </Reveal>
      <div className="mt-10 grid items-center gap-8 lg:grid-cols-2">
        {founding.photo && (
          <Reveal x={-30} y={0}>
            <figure className="overflow-hidden rounded-2xl border border-line/10 shadow-[0_20px_60px_-20px_rgba(249,115,22,0.4)]">
              <Image unoptimized src={founding.photo} alt={founding.title} width={821} height={432} className="h-auto w-full object-cover" />
              <figcaption className="bg-surface px-4 py-2.5 text-center text-xs text-subtle">{founding.title}{founding.date && ` · ${founding.date}`}</figcaption>
            </figure>
          </Reveal>
        )}
        <Reveal x={30} y={0} className={founding.photo ? undefined : 'lg:col-span-2'}>
          <h3 className="text-2xl font-bold text-ink">{founding.title}</h3>
          {founding.text && <p className="mt-4 leading-relaxed text-body">{founding.text}</p>}
          {facts.length > 0 && (
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {facts.map(([Icon, label, value]) => (
                <div key={label} className="flex items-start gap-3 rounded-xl border border-line/10 bg-surface/70 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400"><Icon aria-hidden /></span>
                  <div className="min-w-0">
                    <dt className="text-xs text-subtle">{label}</dt>
                    <dd className="text-sm font-medium text-ink-2">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export default async function Page() {
  const about = await getSetting('about');

  return (
    <MotionRoot>
      <div className="min-h-[70vh] bg-canvas text-body">
        <DarkPageHeader title={about.title} accent={about.accent} subtitle={about.intro} breadcrumbs={[{ label: 'About' }]} />

        <div className="container max-w-6xl 2xl:max-w-7xl py-14 md:py-20">
          {/* Mission & vision */}
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal x={-30} y={0}>
              <MissionCard icon={FaBullseye} title="Our Mission" text={about.mission} />
            </Reveal>
            <Reveal x={30} y={0}>
              <MissionCard icon={FaEye} title="Our Vision" text={about.vision} />
            </Reveal>
          </div>

          <Founding founding={about.founding} />

          {/* Stats */}
          {about.stats.length > 0 && (
            <Stagger className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {about.stats.map((stat) => (
                <StaggerItem key={stat.label}>
                  <div className="rounded-2xl border border-line/10 bg-surface/70 px-4 py-7 text-center transition-colors hover:border-orange-500/60">
                    <p className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-4xl font-extrabold text-transparent">
                      <StatValue value={stat.value} />
                    </p>
                    <p className="mt-2 text-sm text-muted">{stat.label}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          )}

          {/* Journey timeline */}
          {about.timeline.length > 0 && (
            <section className="mt-20">
              <Reveal className="text-center">
                <h2 className="text-3xl font-extrabold text-ink">
                  Our <span className="text-orange-500">Journey</span>
                </h2>
                <span className="mx-auto mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-red-600 to-orange-500" />
              </Reveal>

              <ol className="relative mt-12">
                {/* centre line (left edge on mobile) */}
                <span className="absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-orange-500/70 via-orange-500/30 to-transparent md:left-1/2" aria-hidden />
                {about.timeline.map((item, i) => {
                  const right = i % 2 === 0;
                  return (
                    <li key={`${item.year}-${item.title}`} className="relative mb-8 pl-12 md:grid md:grid-cols-2 md:gap-12 md:pl-0">
                      <span
                        className="absolute left-4 top-7 h-4 w-4 -translate-x-1/2 rounded-full bg-orange-500 ring-4 ring-canvas shadow-[0_0_20px_rgba(249,115,22,0.8)] md:left-1/2"
                        aria-hidden
                      />
                      <Reveal x={right ? 40 : -40} y={0} className={cn(right ? 'md:col-start-2' : 'md:col-start-1 md:row-start-1')}>
                        <div className="rounded-2xl border border-line/10 bg-gradient-to-br from-surface to-canvas-2 p-6 transition-colors hover:border-orange-500/60">
                          <span className="inline-block rounded-full bg-orange-500/15 px-3 py-0.5 text-xs font-bold tracking-wider text-orange-600 dark:text-orange-400">{item.year}</span>
                          <h3 className="mt-3 text-lg font-bold text-ink">{item.title}</h3>
                          {item.text && <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>}
                        </div>
                      </Reveal>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* Call to action */}
          <Reveal className="mt-16">
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-red-500/10 via-surface to-orange-500/10 p-8 text-center md:flex-row md:text-left">
              <div>
                <h2 className="text-2xl font-bold text-ink">Want to be part of the journey?</h2>
                <p className="mt-1 text-muted">Become a club member — workshops, contests, events and a community that builds together.</p>
              </div>
              <HomeButton href="/join" variant="red" className="shrink-0">
                Join the Club <FaArrowRight aria-hidden />
              </HomeButton>
            </div>
          </Reveal>
        </div>
      </div>
    </MotionRoot>
  );
}
