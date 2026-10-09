'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaFacebookF, FaLinkedinIn, FaGithub, FaYoutube, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';
import { siteConfig } from '@/config/site';
import { footerNav, legalNav } from '@/config/navigation';
import { api } from '@/lib/api-client';
import { formatPhone } from '@/lib/utils';
import Container from '@/components/ui/Container';
import Logo from './Logo';

const SOCIAL_ICONS = { facebook: FaFacebookF, linkedin: FaLinkedinIn, github: FaGithub, youtube: FaYoutube };
const linkHover = 'transition-colors hover:text-orange-600 dark:hover:text-orange-400';

function FooterLinks({ title, links }) {
  return (
    <nav aria-label={title}>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink">{title}</h4>
      <ul className="space-y-0.5 text-sm md:space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            {/* py on phones = comfortable tap targets */}
            <Link href={link.href} className={`block py-1.5 text-muted md:inline md:py-0 ${linkHover}`}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// One contact line: icon + content
function ContactRow({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-xs text-orange-600 dark:text-orange-400">
        <Icon aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-1">{children}</div>
    </div>
  );
}

export default function Footer() {
  const [visitors, setVisitors] = useState(null);

  useEffect(() => {
    api.get('/visitor/summary').then((res) => setVisitors(res.data?.stats)).catch(() => {});
  }, []);

  const { contact } = siteConfig;
  const socials = Object.entries(siteConfig.social).filter(([, url]) => url);

  return (
    <footer className="border-t border-line/10 bg-canvas">
      <Container className="grid gap-x-8 gap-y-10 py-10 md:grid-cols-4 md:py-12">
        {/* About + contact */}
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{siteConfig.description}</p>

          <div className="mt-5 space-y-3 text-sm text-muted">
            {contact.address && (
              <ContactRow icon={FaMapMarkerAlt}>
                {contact.mapUrl ? (
                  <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className={linkHover}>{contact.address}</a>
                ) : (
                  contact.address
                )}
              </ContactRow>
            )}
            {contact.email && (
              <ContactRow icon={FaEnvelope}>
                <a href={`mailto:${contact.email}`} className={`break-all ${linkHover}`}>{contact.email}</a>
              </ContactRow>
            )}
            {contact.phones?.length > 0 && (
              <ContactRow icon={FaPhoneAlt}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:flex sm:flex-wrap">
                  {contact.phones.map((phone) => (
                    <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, '')}`} className={`whitespace-nowrap ${linkHover}`}>{formatPhone(phone)}</a>
                  ))}
                </div>
              </ContactRow>
            )}
          </div>

          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-line/15 text-body transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    {Icon && <Icon size={16} />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Link columns: side by side on phones, own columns from md */}
        <div className="grid grid-cols-2 gap-6 border-t border-line/10 pt-8 md:col-span-2 md:border-0 md:pt-0">
          <FooterLinks title="Explore" links={footerNav} />
          <FooterLinks title="Legal" links={legalNav} />
        </div>
      </Container>

      <div className="border-t border-line/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-center text-xs text-subtle sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          {visitors && (
            <ul className="flex flex-wrap justify-center gap-2" aria-label="Visitors">
              {[
                ['Today', visitors.today],
                ['Total', visitors.total],
                ['Online', visitors.online],
              ].map(([label, value]) => (
                <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-line/10 px-2.5 py-1">
                  {label === 'Online' && <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden />}
                  {label}: <span className="font-semibold text-body">{value}</span>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </div>
    </footer>
  );
}
