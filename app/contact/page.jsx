import Image from 'next/image';
import Link from 'next/link';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaExternalLinkAlt, FaWhatsapp, FaArrowRight, FaFacebookF, FaLinkedinIn, FaGithub, FaYoutube, FaUniversity, FaUserPlus, FaUserGraduate, FaCalendarAlt } from 'react-icons/fa';
import { siteConfig } from '@/config/site';
import { cn, formatPhone } from '@/lib/utils';
import { getClubContacts } from '@/server/services/executive.service';
import { getContactInfo } from '@/server/services/settings.service';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import ContactForm from '@/components/forms/ContactForm';

export const metadata = {
  title: 'Contact Us',
  description: `Contact the ${siteConfig.name} — phone, email, campus address and map.`,
};

// Everything here is editable: Settings → Contact details, and the committee in Dashboard → Executives
export const dynamic = 'force-dynamic';

const SOCIAL = { facebook: ['Facebook', FaFacebookF], linkedin: ['LinkedIn', FaLinkedinIn], github: ['GitHub', FaGithub], youtube: ['YouTube', FaYoutube] };

const tel = (phone) => phone.replace(/[^\d+]/g, '');
const whatsapp = (phone) => phone.replace(/\D/g, '').replace(/^0(?=1)/, '880');
const initials = (name) => name.replace(/^(md\.?|mohammad|muhammad)\s+/i, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// Big tappable tile for the main ways to reach the club
function QuickTile({ icon: Icon, label, value, sub, href, external }) {
  return (
    <a
      href={href}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      className="group flex min-w-0 items-start gap-4 rounded-2xl border border-line/10 bg-surface p-5 shadow-lg shadow-black/5 transition-all hover:-translate-y-0.5 hover:border-orange-500/50 hover:shadow-[0_10px_30px_-12px_rgba(249,115,22,0.45)]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-orange-500 text-lg text-white shadow-lg shadow-orange-500/25">
        <Icon aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-widest text-subtle">{label}</span>
        <span className="mt-1 block font-semibold text-ink transition-colors [overflow-wrap:anywhere] group-hover:text-orange-600 dark:group-hover:text-orange-400">
          {/* emails wrap after the @ instead of mid-word */}
          {value.includes('@') ? <>{value.split('@')[0]}@<wbr />{value.split('@')[1]}</> : value}
        </span>
        {sub && <span className="mt-0.5 block text-sm text-muted">{sub}</span>}
      </span>
      <FaArrowRight className="mt-1 shrink-0 text-xs text-faint transition-transform group-hover:translate-x-1 group-hover:text-orange-500" aria-hidden />
    </a>
  );
}

function PersonCard({ person }) {
  return (
    <li className="rounded-xl border border-line/10 bg-canvas/60 p-4">
      <div className="flex items-center gap-3">
        {person.photo ? (
          <Image src={person.photo} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-orange-500/40" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-500 text-sm font-bold text-white">{initials(person.name)}</span>
        )}
        <div className="min-w-0">
          <Link href={`/executives/${person.slug}`} className="block truncate font-semibold text-ink hover:text-orange-600 dark:hover:text-orange-400">{person.name}</Link>
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">{person.role}</span>
        </div>
      </div>
      {person.phone ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={`tel:${tel(person.phone)}`} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-line/15 text-sm font-medium text-body transition-colors hover:border-orange-500 hover:text-ink">
            <FaPhoneAlt aria-hidden className="text-xs" /> {formatPhone(person.phone)}
          </a>
          <a href={`https://wa.me/${whatsapp(person.phone)}`} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
            <FaWhatsapp aria-hidden /> WhatsApp
          </a>
        </div>
      ) : (
        person.email && <a href={`mailto:${person.email}`} className="mt-3 block break-all text-sm text-body hover:text-orange-600 dark:hover:text-orange-400">{person.email}</a>
      )}
    </li>
  );
}

// Short answers that point to the right place on the site
const FAQS = [
  { icon: FaUserPlus, q: 'How do I join the club?', a: 'Fill in the membership form. You get an email when the committee approves it, then you can sign in.', href: '/join', cta: 'Join form' },
  { icon: FaUserGraduate, q: 'I graduated — how do I join the alumni network?', a: 'Apply for alumni membership with your student ID. Approved alumni appear in the directory.', href: '/alumni', cta: 'Alumni' },
  { icon: FaCalendarAlt, q: 'When is the next event or workshop?', a: 'Upcoming events, workshops and contests are posted on News & Events first.', href: '/news', cta: 'News & Events' },
];

export default async function Page() {
  const contact = await getContactInfo();
  const { address, phones = [], email, mapUrl, mapEmbed, departmentUrl, social = {} } = contact;
  const people = contact.showExecutives ? await getClubContacts(contact.executiveCount || 2) : []; // President, Vice President, …
  const socials = Object.entries(SOCIAL).filter(([key]) => social[key]);
  const [hotline, ...otherPhones] = phones;

  return (
    <div className="min-h-[70vh] bg-canvas text-body">
      <DarkPageHeader
        title="Contact"
        accent="Us"
        subtitle="Questions, collaborations or membership — call us, email us, visit the campus or send a message."
        breadcrumbs={[{ label: 'Contact' }]}
      >
        {/* room for the contact tiles that overlap the banner */}
        <div className="h-10 md:h-14" aria-hidden />
      </DarkPageHeader>

      <div className="container max-w-7xl pb-14 2xl:max-w-screen-2xl">
        {/* Quick ways to reach us — overlapping the banner */}
        <div className="relative z-10 -mt-14 grid gap-4 md:-mt-20 md:grid-cols-3">
          {hotline && <QuickTile icon={FaPhoneAlt} label="Call us" value={formatPhone(hotline)} sub={otherPhones.map(formatPhone).join(' · ') || 'Tap to call'} href={`tel:${tel(hotline)}`} />}
          {email && <QuickTile icon={FaEnvelope} label="Email us" value={email} sub="We read every email" href={`mailto:${email}`} />}
          {address && <QuickTile icon={FaMapMarkerAlt} label="Visit us" value="University of South Asia" sub={address} href={mapUrl || '#map'} external={Boolean(mapUrl)} />}
        </div>

        {/* Form + people, same height on large screens */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-line/10 bg-surface p-5 shadow-sm md:p-8 lg:col-span-2" aria-labelledby="send-message">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Write to us</p>
            <h2 id="send-message" className="mt-1 text-2xl font-bold text-ink md:text-3xl">Send a message</h2>
            <p className="mb-6 mt-1 text-sm text-muted">Membership, events, sponsorship or anything else — the committee reads every message.</p>
            <ContactForm />
          </section>

          <aside className="flex flex-col gap-6">
            {people.length > 0 && (
              <section className="flex flex-1 flex-col rounded-2xl border border-line/10 bg-surface p-5 shadow-sm" aria-labelledby="committee">
                <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Committee {people[0].year}</p>
                <h2 id="committee" className="mt-1 text-lg font-bold text-ink">Talk to the club</h2>
                <p className="mb-4 mt-0.5 text-sm text-muted">Call or WhatsApp our student executives.</p>
                <ul className="space-y-3">{people.map((p) => <PersonCard key={p.slug} person={p} />)}</ul>
                <Link href="/executives" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-orange-600 hover:underline dark:text-orange-400">
                  Meet the full committee <FaArrowRight className="text-xs" aria-hidden />
                </Link>
              </section>
            )}

            {(departmentUrl || socials.length > 0) && (
              <section className="rounded-2xl border border-line/10 bg-surface p-5 shadow-sm">
                {departmentUrl && (
                  <a href={departmentUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-lg text-orange-600 dark:text-orange-400"><FaUniversity aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink group-hover:text-orange-600 dark:group-hover:text-orange-400">Department of CSE</span>
                      <span className="block text-xs text-muted">B.Sc. in Computer Science &amp; Engineering</span>
                    </span>
                    <FaExternalLinkAlt className="shrink-0 text-xs text-faint group-hover:text-orange-500" aria-hidden />
                  </a>
                )}
                {socials.length > 0 && (
                  <div className={cn('flex items-center justify-between gap-3', departmentUrl && 'mt-4 border-t border-line/10 pt-4')}>
                    <p className="text-sm font-medium text-body">Follow the club</p>
                    <div className="flex gap-2">
                      {socials.map(([key, [label, Icon]]) => (
                        <a key={key} href={social[key]} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="flex h-10 w-10 items-center justify-center rounded-full border border-line/15 text-body transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white">
                          <Icon aria-hidden />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </aside>
        </div>

        {/* Quick answers */}
        <section className="mt-12" aria-labelledby="faq">
          <div className="mb-5 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Before you write</p>
            <h2 id="faq" className="mt-1 text-2xl font-bold text-ink">Quick answers</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {FAQS.map(({ icon: Icon, q, a, href, cta }) => (
              <Link key={q} href={href} className="group flex flex-col rounded-2xl border border-line/10 bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-orange-500/50">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400"><Icon aria-hidden /></span>
                <h3 className="mt-3 font-semibold text-ink">{q}</h3>
                <p className="mt-1 flex-1 text-sm text-muted">{a}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 dark:text-orange-400">
                  {cta} <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Map */}
        {mapEmbed && (
          <section id="map" className="relative mt-12 overflow-hidden rounded-2xl border border-line/10 bg-surface shadow-sm" aria-label="Map">
            <iframe
              title="University of South Asia on Google Maps"
              src={mapEmbed}
              className="h-[360px] w-full md:h-[460px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="pointer-events-none absolute inset-x-3 bottom-3 sm:inset-x-auto sm:left-4 sm:max-w-sm">
              <div className="pointer-events-auto rounded-xl border border-line/10 bg-surface/95 p-4 shadow-xl backdrop-blur">
                <p className="flex items-center gap-2 font-semibold text-ink"><FaMapMarkerAlt className="text-orange-500" aria-hidden /> University of South Asia</p>
                <p className="mt-1 text-sm text-muted">{address}</p>
                {mapUrl && (
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-3 py-1.5 text-sm font-semibold text-white">
                    Get directions <FaExternalLinkAlt className="text-[10px]" aria-hidden />
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
