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
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/logo.png', width: 270, height: 251, alt: siteConfig.name }],
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
