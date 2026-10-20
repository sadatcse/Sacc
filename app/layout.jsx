import '@/styles/globals.css';
import AppShell from '@/components/layout/AppShell';
import { siteConfig } from '@/config/site';
import { getCachedSetting, getContactInfo } from '@/server/services/settings.service';
import { DEFAULT_TIME_ZONE, setTimeZone } from '@/lib/timezone';

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  // Home page: "University of South Asia Computer Club — Empowering Innovation Through Technology"; other pages: "Page | SACC"
  title: {
    default: `${siteConfig.name} — ${siteConfig.slogan}`,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    'University of South Asia', 'South Asia Computer Club', 'SACC', 'USACC', 'computer club', 'CSE club', 'Bangladesh',
    'Dhaka', 'programming contest', 'competitive programming', 'workshop', 'seminar', 'hackathon', 'computer science',
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: 'education',
  alternates: { canonical: '/' },
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  // The preview image comes from app/opengraph-image.jsx (pages with a photo of their own override it)
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
    url: '/',
    siteName: siteConfig.name,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
  },
  // Search Console / Bing Webmaster verification codes (optional, from .env)
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && { google: process.env.GOOGLE_SITE_VERIFICATION }),
    ...(process.env.BING_SITE_VERIFICATION && { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } }),
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

// Every page reads the site settings (timezone, contact details for the footer) per request, so changes apply immediately
export const dynamic = 'force-dynamic';

// Applies the saved theme (or the system preference) before first paint — no light/dark flash
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

async function readTimeZone() {
  try {
    return (await getCachedSetting('site')).timezone; // cached 60 s — keeps first paint fast
  } catch {
    return DEFAULT_TIME_ZONE; // database unreachable — pages still render
  }
}

export default async function RootLayout({ children }) {
  const [timeZone, contact] = await Promise.all([readTimeZone(), getContactInfo()]);
  setTimeZone(timeZone);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <AppShell timeZone={timeZone} contact={contact}>{children}</AppShell>
      </body>
    </html>
  );
}
