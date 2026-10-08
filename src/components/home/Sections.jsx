import Image from 'next/image';
import {
  FaArrowRight, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaFacebookF, FaLinkedinIn, FaGithub, FaYoutube, FaUserTie, FaUsers,
} from 'react-icons/fa';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { getCommittee, getLatestYear } from '@/server/services/executive.service';
import { getGalleryPhotos } from '@/lib/gallery';
import { getHomeFeed } from '@/server/services/news.service';
import { newsCategories, UPCOMING } from '@/data/news-categories';
import { formatCalendarDate } from '@/lib/utils';
import {
  about, whatWeDo, technologies, projects, alumniText, exploreCse,
} from '@/data/home';
import { Counter, Reveal, Stagger, StaggerItem } from './motion';
import { CoverImage, DateBadge, HomeButton, HomeHeading, HomeSection, IconBadge, Panel } from './ui';

function initials(name) {
  return name.split(' ').filter((w) => !w.endsWith('.')).slice(0, 2).map((w) => w[0]).join('');
}

// Current committee's top positions (from MongoDB)
const HOME_EXECUTIVE_COUNT = 5;

export function AboutSection() {
  return (
    <HomeSection id="about" className="bg-canvas">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal x={-40} y={0}>
          <h2 className="text-2xl uppercase tracking-wide text-ink md:text-3xl">
            About <span className="text-orange-500">SACC</span>
          </h2>
          <span className="mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-red-600 to-orange-500" />
          <p className="mt-6 leading-relaxed text-muted">{about.text}</p>
          <HomeButton href="/about" variant="outline" className="mt-8">
            Learn More <FaArrowRight aria-hidden />
          </HomeButton>
        </Reveal>
        <Reveal x={40} y={0} delay={0.1}>
          <div className="relative">
            <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-red-600/40 to-orange-500/10 blur-xl" />
            <CoverImage src={about.image} alt="Students working together" sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[16/10] rounded-2xl ring-1 ring-line/10" />
          </div>
        </Reveal>
      </div>

      <Stagger className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {about.stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <Panel className="flex flex-col items-center p-5 text-center">
              <IconBadge icon={stat.icon} />
              <p className="mt-3 text-xs uppercase tracking-wider text-muted">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
                <Counter value={stat.value} suffix={stat.suffix} from={stat.suffix ? 0 : stat.value - 20} />
              </p>
            </Panel>
          </StaggerItem>
        ))}
      </Stagger>
    </HomeSection>
  );
}

export function WhatWeDoSection() {
  return (
    <HomeSection className="bg-canvas-2">
      <HomeHeading>What We Do</HomeHeading>
      <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {whatWeDo.map((item) => (
          <StaggerItem key={item.title}>
            <Panel className="flex flex-col items-center p-7 text-center">
              <IconBadge icon={item.icon} size="lg" />
              <h3 className="mt-4 text-lg text-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.text}</p>
            </Panel>
          </StaggerItem>
        ))}
      </Stagger>
    </HomeSection>
  );
}

export function TechAndProjectsSection() {
  return (
    <HomeSection className="bg-canvas">
      <HomeHeading>Technology Beyond Boundaries</HomeHeading>
      <Stagger className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5" gap={0.05}>
        {technologies.map((tech) => (
          <StaggerItem key={tech.label} className="group flex flex-col items-center text-center">
            <IconBadge icon={tech.icon} size="lg" className="transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white" />
            <span className="mt-3 text-sm text-body">{tech.label}</span>
          </StaggerItem>
        ))}
      </Stagger>

      <HomeHeading className="mt-20">Project Showcase</HomeHeading>
      <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {projects.map((project) => (
          <StaggerItem key={project.title}>
            <Panel className="overflow-hidden">
              <CoverImage src={project.image} alt={project.title} sizes="(min-width: 1024px) 20vw, 50vw" className="aspect-[4/3]" />
              <p className="p-3 text-center text-sm font-medium text-ink-2">{project.title}</p>
            </Panel>
          </StaggerItem>
        ))}
      </Stagger>
    </HomeSection>
  );
}

// Post → card data for the dated card grids (event date for events, publish date otherwise)
function toDatedCard(post) {
  const date = post.event?.date || post.date;
  return {
    key: post.slug,
    href: `/news/${post.slug}`,
    day: formatCalendarDate(date, { day: '2-digit' }),
    month: formatCalendarDate(date, { month: 'short' }).toUpperCase(),
    title: post.title,
    text: post.excerpt,
    image: post.cover,
  };
}

function DatedCards({ items, showText }) {
  return (
    <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <StaggerItem key={item.key}>
          <Link href={item.href} className="group block h-full">
            <Panel className="h-full overflow-hidden transition-colors group-hover:border-orange-500/60">
              <div className="relative">
                <DateBadge day={item.day} month={item.month} />
                <CoverImage src={item.image} alt={item.title} className="aspect-[4/3]" />
              </div>
              <div className="p-4 text-center">
                <h3 className="line-clamp-2 text-base text-ink transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400">{item.title}</h3>
                {showText && item.text && <p className="mt-1 line-clamp-2 text-sm text-muted">{item.text}</p>}
              </div>
            </Panel>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function EmptyNote({ children }) {
  return <p className="rounded-xl border border-dashed border-line/15 py-10 text-center text-sm text-muted">{children}</p>;
}

// From the database: upcoming events (soonest first); falls back to recent events when none are scheduled
export async function EventsSection() {
  const { upcoming, recentEvents } = await getHomeFeed();
  const hasUpcoming = upcoming.length > 0;
  const items = (hasUpcoming ? upcoming : recentEvents).map(toDatedCard);
  return (
    <HomeSection id="events" className="bg-canvas-2">
      <HomeHeading>{hasUpcoming ? 'Upcoming Events' : 'Recent Events'}</HomeHeading>
      {!hasUpcoming && items.length > 0 && (
        <p className="-mt-4 mb-8 text-center text-sm text-muted">No upcoming events are scheduled right now — here is what we did recently.</p>
      )}
      {items.length ? <DatedCards items={items} showText /> : <EmptyNote>Events will appear here soon.</EmptyNote>}
      <Reveal className="mt-10 text-center">
        <HomeButton href={hasUpcoming ? `/news?category=${UPCOMING}` : '/news'}>View All Events <FaArrowRight aria-hidden /></HomeButton>
      </Reveal>
    </HomeSection>
  );
}

// From the database: news categories with post counts + latest achievement photos
const ACHIEVEMENT_LINKS = ['activities-achievements', 'contests-hackathons', 'sports-games', 'workshops-seminars', 'projects-innovation'];

export async function AchievementsSection() {
  const { achievementPhotos, counts } = await getHomeFeed();
  const categories = ACHIEVEMENT_LINKS.map((key) => newsCategories.find((c) => c.key === key)).filter(Boolean);
  return (
    <HomeSection className="bg-canvas">
      <HomeHeading>Activities &amp; Achievements</HomeHeading>
      <Stagger className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
        {categories.map((cat, i) => (
          <StaggerItem key={cat.key} className={i === 4 ? 'col-span-2 sm:col-span-1' : undefined}>
            <Link href={`/news?category=${cat.key}`} className="group flex flex-col items-center text-center">
              <IconBadge icon={cat.icon} size="lg" />
              <span className="mt-3 text-sm text-body transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400">{cat.label}</span>
              <span className="mt-0.5 text-xs text-subtle">{counts[cat.key] || 0} posts</span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
      {achievementPhotos.length > 0 && (
        <Stagger className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {achievementPhotos.map((post, i) => (
            <StaggerItem key={post.slug} className={i === 4 ? 'hidden md:block' : i === 3 ? 'hidden sm:block' : undefined}>
              <Link href={`/news/${post.slug}`} className="group relative block" title={post.title}>
                <CoverImage src={post.cover} alt={post.title} sizes="(min-width: 768px) 20vw, 50vw" className="aspect-[4/3] rounded-lg ring-1 ring-line/10" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 line-clamp-2 p-2.5 text-xs font-semibold text-white">{post.title}</span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
      <Reveal className="mt-10 text-center">
        <HomeButton href="/news?category=activities-achievements">See All Achievements <FaArrowRight aria-hidden /></HomeButton>
      </Reveal>
    </HomeSection>
  );
}

// From the database: latest posts in "Workshops & Seminars"
export async function WorkshopsSection() {
  const { workshops } = await getHomeFeed();
  return (
    <HomeSection className="bg-canvas-2">
      <HomeHeading>Workshops &amp; Seminars</HomeHeading>
      {workshops.length ? <DatedCards items={workshops.map(toDatedCard)} /> : <EmptyNote>Workshops and seminars will appear here soon.</EmptyNote>}
      <Reveal className="mt-10 text-center">
        <HomeButton href="/news?category=workshops-seminars">View All Workshops <FaArrowRight aria-hidden /></HomeButton>
      </Reveal>
    </HomeSection>
  );
}

export async function ExecutivesSection() {
  const executives = (await getCommittee(await getLatestYear())).executives.slice(0, HOME_EXECUTIVE_COUNT);
  return (
    <HomeSection className="bg-canvas">
      <HomeHeading>Executive Committee</HomeHeading>
      <Stagger className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
        {executives.map((person) => (
          <StaggerItem key={person.slug} className="text-center">
            <Link href={`/executives/${person.slug}?year=${person.year}`} className="group flex flex-col items-center">
            <div className="rounded-full bg-gradient-to-br from-red-600 to-orange-500 p-[3px] shadow-[0_0_25px_-5px_rgba(249,115,22,0.6)]">
              {person.photo ? (
                <Image unoptimized src={person.photo} alt={person.name} width={112} height={112} className="h-28 w-28 rounded-full object-cover" />
              ) : (
                <span className="flex h-28 w-28 items-center justify-center rounded-full bg-surface text-2xl font-bold text-ink">
                  {initials(person.name)}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">{person.role}</p>
            <p className="mt-1 text-ink-2 transition-colors group-hover:text-ink">{person.name}</p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
      <Reveal className="mt-10 text-center">
        <HomeButton href="/executives" variant="outline">Meet the Committee <FaArrowRight aria-hidden /></HomeButton>
      </Reveal>
    </HomeSection>
  );
}

function CardTitle({ children }) {
  return <h3 className="mb-5 text-center text-lg uppercase tracking-wide text-ink">{children}</h3>;
}

export async function CommunitySection() {
  // First faculty advisor of the newest committee (the Chief Advisor)
  const year = await getLatestYear();
  const [advisor] = (await getCommittee(year)).advisors;
  return (
    <HomeSection className="bg-canvas-2">
      <Stagger className="grid gap-5 lg:grid-cols-3">
        <StaggerItem>
          <Panel className="flex flex-col p-6">
            <CardTitle>CSE Faculty / Advisor</CardTitle>
            {advisor ? (
              <Link href={`/executives/${advisor.slug}?year=${year}`} className="group flex flex-1 items-center gap-4">
                {advisor.photo ? (
                  <Image unoptimized src={advisor.photo} alt={advisor.name} width={80} height={96} className="h-24 w-20 shrink-0 rounded-lg object-cover ring-1 ring-orange-500/40" />
                ) : (
                  <span className="flex h-24 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-4xl text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/40">
                    <FaUserTie aria-hidden />
                  </span>
                )}
                <div className="text-sm">
                  <p className="font-semibold text-ink transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400">{advisor.name}</p>
                  <p className="text-orange-600 dark:text-orange-400">{advisor.role}, {siteConfig.shortName}</p>
                  {advisor.designation && <p className="text-muted">{advisor.designation}</p>}
                  {advisor.department && <p className="text-muted">Dept. of {advisor.department.replace('Computer Science & Engineering', 'CSE')}</p>}
                  <p className="text-muted">University of South Asia</p>
                </div>
              </Link>
            ) : (
              <p className="flex-1 text-sm text-muted">Faculty advisors will be listed here.</p>
            )}
            <HomeButton href={`/executives?year=${year}`} variant="red" className="mt-6 self-center">View Faculty</HomeButton>
          </Panel>
        </StaggerItem>

        <StaggerItem>
          <Panel className="flex flex-col items-center p-6 text-center">
            <CardTitle>Alumni &amp; Mentorship</CardTitle>
            <IconBadge icon={FaUsers} size="lg" />
            <p className="mt-4 flex-1 text-sm text-muted">{alumniText}</p>
            <HomeButton href="/alumni" variant="red" className="mt-6">Meet Our Alumni</HomeButton>
          </Panel>
        </StaggerItem>

        <StaggerItem>
          <Panel className="flex flex-col p-6">
            <CardTitle>Gallery</CardTitle>
            <div className="grid flex-1 grid-cols-3 gap-2">
              {getGalleryPhotos().slice(0, 6).map((photo) => (
                <CoverImage key={photo.src} src={photo.src} alt={photo.caption || 'Club gallery photo'} sizes="(min-width: 1024px) 10vw, 33vw" className="aspect-square rounded-md" />
              ))}
            </div>
            <HomeButton href="/gallery" variant="red" className="mt-6 self-center">View Gallery</HomeButton>
          </Panel>
        </StaggerItem>
      </Stagger>
    </HomeSection>
  );
}

const SOCIAL_ICONS = { facebook: FaFacebookF, linkedin: FaLinkedinIn, github: FaGithub, youtube: FaYoutube };

export function ConnectSection() {
  const { contact, social } = siteConfig;
  const contactRows = [
    contact.address && { icon: FaMapMarkerAlt, text: contact.address },
    contact.email && { icon: FaEnvelope, text: contact.email, href: `mailto:${contact.email}` },
    contact.phone && { icon: FaPhoneAlt, text: contact.phone, href: `tel:${contact.phone}` },
  ].filter(Boolean);

  return (
    <HomeSection id="join" className="bg-canvas">
      <Stagger className="grid gap-5 lg:grid-cols-12">
        <StaggerItem className="lg:col-span-3">
          <Panel className="flex flex-col p-6">
            <CardTitle>Explore CSE</CardTitle>
            <div className="grid flex-1 grid-cols-3 gap-2">
              {exploreCse.map((item) => (
                <div key={item.label} className="flex flex-col items-center rounded-lg border border-line/10 p-2 text-center transition-colors hover:border-orange-500/60">
                  <item.icon className="text-xl text-orange-600 dark:text-orange-400" aria-hidden />
                  <span className="mt-1 text-[11px] text-body">{item.label}</span>
                </div>
              ))}
            </div>
            <HomeButton href="/about" variant="red" className="mt-6 self-center">About the Club</HomeButton>
          </Panel>
        </StaggerItem>

        <StaggerItem className="lg:col-span-3">
          <Panel className="flex flex-col items-center p-6 text-center">
            <CardTitle>Join the Club</CardTitle>
            <IconBadge icon={FaUsers} size="lg" />
            <p className="mt-4 flex-1 text-sm text-muted">
              Be a part of a passionate community and shape the future of technology together.
            </p>
            <HomeButton href="/join" variant="red" className="mt-6">Apply Now</HomeButton>
          </Panel>
        </StaggerItem>

        <StaggerItem className="lg:col-span-6">
          <Panel className="grid h-full gap-6 p-6 sm:grid-cols-2">
            <div>
              <CardTitle>Contact Us</CardTitle>
              <ul className="space-y-3 text-sm">
                {contactRows.map(({ icon: Icon, text, href }) => (
                  <li key={text} className="flex items-start gap-3 text-body">
                    <Icon className="mt-0.5 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
                    {href ? <a href={href} className="break-all hover:text-orange-600 dark:hover:text-orange-400">{text}</a> : <span>{text}</span>}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex gap-2">
                {Object.entries(SOCIAL_ICONS).map(([key, Icon]) => {
                  const url = social[key];
                  const classes = 'flex h-9 w-9 items-center justify-center rounded-md border border-line/10 text-body transition-colors';
                  return url ? (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={key} className={`${classes} hover:border-orange-500 hover:bg-orange-500 hover:text-white`}>
                      <Icon aria-hidden />
                    </a>
                  ) : (
                    <span key={key} className={`${classes} opacity-40`} title={`Add ${key} link in src/config/site.js`}>
                      <Icon aria-hidden />
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center border-t border-line/10 pt-6 text-center sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <Image src="/logo.png" alt="Club logo" width={96} height={89} className="h-20 w-auto" />
              <p className="mt-3 font-bold uppercase text-ink">South Asia Computer Club</p>
              <p className="text-xs text-muted">University of South Asia</p>
              <p className="mt-2 text-sm font-medium text-orange-600 dark:text-orange-400">Empowering Innovation Through Technology</p>
            </div>
          </Panel>
        </StaggerItem>
      </Stagger>
    </HomeSection>
  );
}
