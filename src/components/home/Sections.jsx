import Image from 'next/image';
import {
  FaArrowRight, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaFacebookF, FaLinkedinIn, FaGithub, FaYoutube, FaUserTie, FaUsers,
} from 'react-icons/fa';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { getCommittee, getLatestYear } from '@/lib/executives';
import {
  about, whatWeDo, technologies, projects, events, achievements, workshops, advisor, alumniText, gallery, exploreCse,
} from '@/data/home';
import { Counter, Reveal, Stagger, StaggerItem } from './motion';
import { CoverImage, DateBadge, HomeButton, HomeHeading, HomeSection, IconBadge, Panel } from './ui';

function initials(name) {
  return name.split(' ').filter((w) => !w.endsWith('.')).slice(0, 2).map((w) => w[0]).join('');
}

// Current committee's top positions, from src/data/executives.js
const HOME_EXECUTIVE_COUNT = 5;

export function AboutSection() {
  return (
    <HomeSection id="about" className="bg-black">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal x={-40} y={0}>
          <h2 className="text-2xl uppercase tracking-wide text-white md:text-3xl">
            About <span className="text-orange-500">SACC</span>
          </h2>
          <span className="mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-red-600 to-orange-500" />
          <p className="mt-6 leading-relaxed text-neutral-400">{about.text}</p>
          <HomeButton href="/about" variant="outline" className="mt-8">
            Learn More <FaArrowRight aria-hidden />
          </HomeButton>
        </Reveal>
        <Reveal x={40} y={0} delay={0.1}>
          <div className="relative">
            <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-red-600/40 to-orange-500/10 blur-xl" />
            <CoverImage src={about.image} alt="Students working together" sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[16/10] rounded-2xl ring-1 ring-white/10" />
          </div>
        </Reveal>
      </div>

      <Stagger className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {about.stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <Panel className="flex flex-col items-center p-5 text-center">
              <IconBadge icon={stat.icon} />
              <p className="mt-3 text-xs uppercase tracking-wider text-neutral-400">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-orange-400">
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
    <HomeSection className="bg-neutral-950">
      <HomeHeading>What We Do</HomeHeading>
      <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {whatWeDo.map((item) => (
          <StaggerItem key={item.title}>
            <Panel className="flex flex-col items-center p-7 text-center">
              <IconBadge icon={item.icon} size="lg" />
              <h3 className="mt-4 text-lg text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-neutral-400">{item.text}</p>
            </Panel>
          </StaggerItem>
        ))}
      </Stagger>
    </HomeSection>
  );
}

export function TechAndProjectsSection() {
  return (
    <HomeSection className="bg-black">
      <HomeHeading>Technology Beyond Boundaries</HomeHeading>
      <Stagger className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5" gap={0.05}>
        {technologies.map((tech) => (
          <StaggerItem key={tech.label} className="group flex flex-col items-center text-center">
            <IconBadge icon={tech.icon} size="lg" className="transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white" />
            <span className="mt-3 text-sm text-neutral-300">{tech.label}</span>
          </StaggerItem>
        ))}
      </Stagger>

      <HomeHeading className="mt-20">Project Showcase</HomeHeading>
      <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {projects.map((project) => (
          <StaggerItem key={project.title}>
            <Panel className="overflow-hidden">
              <CoverImage src={project.image} alt={project.title} sizes="(min-width: 1024px) 20vw, 50vw" className="aspect-[4/3]" />
              <p className="p-3 text-center text-sm font-medium text-neutral-200">{project.title}</p>
            </Panel>
          </StaggerItem>
        ))}
      </Stagger>
    </HomeSection>
  );
}

function DatedCards({ items, showText }) {
  return (
    <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <StaggerItem key={item.title}>
          <Panel className="overflow-hidden">
            <div className="relative">
              <DateBadge day={item.day} month={item.month} />
              <CoverImage src={item.image} alt={item.title} className="aspect-[4/3]" />
            </div>
            <div className="p-4 text-center">
              <h3 className="text-base text-white">{item.title}</h3>
              {showText && <p className="mt-1 text-sm text-neutral-400">{item.text}</p>}
            </div>
          </Panel>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function EventsSection() {
  return (
    <HomeSection id="events" className="bg-neutral-950">
      <HomeHeading>Upcoming Events</HomeHeading>
      <DatedCards items={events} showText />
      <Reveal className="mt-10 text-center">
        <HomeButton href="/news">View All Events <FaArrowRight aria-hidden /></HomeButton>
      </Reveal>
    </HomeSection>
  );
}

export function AchievementsSection() {
  return (
    <HomeSection className="bg-black">
      <HomeHeading>Activities &amp; Achievements</HomeHeading>
      <Stagger className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
        {achievements.items.map((item) => (
          <StaggerItem key={item.label} className="flex flex-col items-center text-center">
            <IconBadge icon={item.icon} size="lg" />
            <span className="mt-3 text-sm text-neutral-300">{item.label}</span>
          </StaggerItem>
        ))}
      </Stagger>
      <Stagger className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {achievements.photos.map((src, i) => (
          <StaggerItem key={src} className={i === 4 ? 'hidden sm:block' : undefined}>
            <CoverImage src={src} alt="Club activity" sizes="(min-width: 768px) 20vw, 50vw" className="aspect-[4/3] rounded-lg ring-1 ring-white/10" />
          </StaggerItem>
        ))}
      </Stagger>
      <Reveal className="mt-10 text-center">
        <HomeButton href="/news">See All Achievements <FaArrowRight aria-hidden /></HomeButton>
      </Reveal>
    </HomeSection>
  );
}

export function WorkshopsSection() {
  return (
    <HomeSection className="bg-neutral-950">
      <HomeHeading>Workshops &amp; Seminars</HomeHeading>
      <DatedCards items={workshops} />
      <Reveal className="mt-10 text-center">
        <HomeButton href="/news">View All Workshops <FaArrowRight aria-hidden /></HomeButton>
      </Reveal>
    </HomeSection>
  );
}

export function ExecutivesSection() {
  const executives = getCommittee(getLatestYear()).executives.slice(0, HOME_EXECUTIVE_COUNT);
  return (
    <HomeSection className="bg-black">
      <HomeHeading>Executive Committee</HomeHeading>
      <Stagger className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
        {executives.map((person) => (
          <StaggerItem key={person.slug} className="text-center">
            <Link href={`/executives/${person.slug}?year=${person.year}`} className="group flex flex-col items-center">
            <div className="rounded-full bg-gradient-to-br from-red-600 to-orange-500 p-[3px] shadow-[0_0_25px_-5px_rgba(249,115,22,0.6)]">
              {person.photo ? (
                <Image src={person.photo} alt={person.name} width={112} height={112} className="h-28 w-28 rounded-full object-cover" />
              ) : (
                <span className="flex h-28 w-28 items-center justify-center rounded-full bg-neutral-900 text-2xl font-bold text-white">
                  {initials(person.name)}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-orange-400">{person.role}</p>
            <p className="mt-1 text-neutral-200 transition-colors group-hover:text-white">{person.name}</p>
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
  return <h3 className="mb-5 text-center text-lg uppercase tracking-wide text-white">{children}</h3>;
}

export function CommunitySection() {
  return (
    <HomeSection className="bg-neutral-950">
      <Stagger className="grid gap-5 lg:grid-cols-3">
        <StaggerItem>
          <Panel className="flex flex-col p-6">
            <CardTitle>CSE Faculty / Advisor</CardTitle>
            <div className="flex flex-1 items-center gap-4">
              <span className="flex h-24 w-20 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-4xl text-orange-400 ring-1 ring-orange-500/40">
                <FaUserTie aria-hidden />
              </span>
              <div className="text-sm">
                <p className="font-semibold text-white">{advisor.name}</p>
                {advisor.lines.map((line) => (
                  <p key={line} className="text-neutral-400">{line}</p>
                ))}
              </div>
            </div>
            <HomeButton href="/about" variant="red" className="mt-6 self-center">View Faculty</HomeButton>
          </Panel>
        </StaggerItem>

        <StaggerItem>
          <Panel className="flex flex-col items-center p-6 text-center">
            <CardTitle>Alumni &amp; Mentorship</CardTitle>
            <IconBadge icon={FaUsers} size="lg" />
            <p className="mt-4 flex-1 text-sm text-neutral-400">{alumniText}</p>
            <HomeButton href="/alumni" variant="red" className="mt-6">Meet Our Alumni</HomeButton>
          </Panel>
        </StaggerItem>

        <StaggerItem>
          <Panel className="flex flex-col p-6">
            <CardTitle>Gallery</CardTitle>
            <div className="grid flex-1 grid-cols-3 gap-2">
              {gallery.map((src) => (
                <CoverImage key={src} src={src} alt="Club gallery photo" sizes="(min-width: 1024px) 10vw, 33vw" className="aspect-square rounded-md" />
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
    <HomeSection id="join" className="bg-black">
      <Stagger className="grid gap-5 lg:grid-cols-12">
        <StaggerItem className="lg:col-span-3">
          <Panel className="flex flex-col p-6">
            <CardTitle>Explore CSE</CardTitle>
            <div className="grid flex-1 grid-cols-3 gap-2">
              {exploreCse.map((item) => (
                <div key={item.label} className="flex flex-col items-center rounded-lg border border-white/10 p-2 text-center transition-colors hover:border-orange-500/60">
                  <item.icon className="text-xl text-orange-400" aria-hidden />
                  <span className="mt-1 text-[11px] text-neutral-300">{item.label}</span>
                </div>
              ))}
            </div>
            <HomeButton href="/about" variant="red" className="mt-6 self-center">Visit CSE Department</HomeButton>
          </Panel>
        </StaggerItem>

        <StaggerItem className="lg:col-span-3">
          <Panel className="flex flex-col items-center p-6 text-center">
            <CardTitle>Join the Club</CardTitle>
            <IconBadge icon={FaUsers} size="lg" />
            <p className="mt-4 flex-1 text-sm text-neutral-400">
              Be a part of a passionate community and shape the future of technology together.
            </p>
            <HomeButton href="/contact" variant="red" className="mt-6">Apply Now</HomeButton>
          </Panel>
        </StaggerItem>

        <StaggerItem className="lg:col-span-6">
          <Panel className="grid h-full gap-6 p-6 sm:grid-cols-2">
            <div>
              <CardTitle>Contact Us</CardTitle>
              <ul className="space-y-3 text-sm">
                {contactRows.map(({ icon: Icon, text, href }) => (
                  <li key={text} className="flex items-start gap-3 text-neutral-300">
                    <Icon className="mt-0.5 shrink-0 text-orange-400" aria-hidden />
                    {href ? <a href={href} className="break-all hover:text-orange-400">{text}</a> : <span>{text}</span>}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex gap-2">
                {Object.entries(SOCIAL_ICONS).map(([key, Icon]) => {
                  const url = social[key];
                  const classes = 'flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-neutral-300 transition-colors';
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
            <div className="flex flex-col items-center justify-center border-t border-white/10 pt-6 text-center sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <Image src="/logo.png" alt="Club logo" width={96} height={89} className="h-20 w-auto" />
              <p className="mt-3 font-bold uppercase text-white">South Asia Computer Club</p>
              <p className="text-xs text-neutral-400">University of South Asia</p>
              <p className="mt-2 text-sm font-medium text-orange-400">Empowering Innovation Through Technology</p>
            </div>
          </Panel>
        </StaggerItem>
      </Stagger>
    </HomeSection>
  );
}
