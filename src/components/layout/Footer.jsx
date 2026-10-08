'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaFacebook, FaLinkedin, FaGithub, FaYoutube } from 'react-icons/fa';
import { siteConfig } from '@/config/site';
import { mainNav, legalNav } from '@/config/navigation';
import { api } from '@/lib/api-client';
import Container from '@/components/ui/Container';
import Logo from './Logo';

const SOCIAL_ICONS = { facebook: FaFacebook, linkedin: FaLinkedin, github: FaGithub, youtube: FaYoutube };

function FooterLinks({ title, links }) {
  return (
    <div>
      <h4 className="mb-3 text-sm uppercase tracking-wide">{title}</h4>
      <ul className="space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-muted hover:text-orange-600 dark:hover:text-orange-400">{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const [visitors, setVisitors] = useState(null);

  useEffect(() => {
    api.get('/visitor/summary').then((res) => setVisitors(res.data?.stats)).catch(() => {});
  }, []);

  const socials = Object.entries(siteConfig.social).filter(([, url]) => url);

  return (
    <footer className="border-t border-line/10 bg-canvas">
      <Container className="grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted">{siteConfig.description}</p>
          <div className="mt-4 space-y-1 text-sm text-muted">
            <p>{siteConfig.contact.address}</p>
            {siteConfig.contact.email && <p>{siteConfig.contact.email}</p>}
            {siteConfig.contact.phone && <p>{siteConfig.contact.phone}</p>}
          </div>
          {socials.length > 0 && (
            <div className="mt-4 flex gap-3">
              {socials.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={key} className="text-subtle hover:text-orange-600 dark:hover:text-orange-400">
                    {Icon && <Icon size={20} />}
                  </a>
                );
              })}
            </div>
          )}
        </div>
        <FooterLinks title="Explore" links={mainNav} />
        <FooterLinks title="Legal" links={legalNav} />
      </Container>

      <div className="border-t border-line/10">
        <Container className="flex flex-col items-center justify-between gap-2 py-4 text-xs text-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          {visitors && (
            <p>
              Today: {visitors.today} · Total: {visitors.total} · Online: {visitors.online}
            </p>
          )}
        </Container>
      </div>
    </footer>
  );
}
