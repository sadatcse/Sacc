// SEO helpers shared by page metadata, structured data (JSON-LD) and the sitemap.
import { siteConfig } from '@/config/site';

export const SITE_URL = siteConfig.url.replace(/\/$/, '');

// '/news/x' or 'https://…' → full URL (search engines and link previews need absolute image / page URLs)
export const absoluteUrl = (value = '/') => (/^https?:\/\//i.test(value) ? value : `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`);

// Plain-text description of at most `max` characters, cut at a word
export function describe(text = '', max = 160) {
  const clean = String(text).replace(/[*_`#>[\]]/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

// The club as a schema.org Organization (home page, and the publisher of articles / events)
export function organizationSchema(contact = {}) {
  const social = Object.values(contact.social || siteConfig.social || {}).filter(Boolean);
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    description: siteConfig.description,
    ...(contact.email && { email: contact.email }),
    ...(contact.address && { address: { '@type': 'PostalAddress', streetAddress: contact.address, addressCountry: 'BD' } }),
    ...(contact.phones?.length && { contactPoint: [{ '@type': 'ContactPoint', telephone: contact.phones[0], contactType: 'customer support', areaServed: 'BD' }] }),
    parentOrganization: { '@type': 'CollegeOrUniversity', name: 'University of South Asia', url: 'https://southasiauni.ac.bd' },
    ...(social.length && { sameAs: social }),
  };
}
