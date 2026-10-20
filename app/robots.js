import { SITE_URL } from '@/lib/seo';

// /robots.txt — public pages are open to search engines; private areas, the API and members-only pages are not.
// Gallery images (/api/gallery/image/…) and uploaded photos (/uploads/…) stay crawlable for image search.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/gallery/image/', '/uploads/'],
        disallow: [
          '/dashboard', // admin area
          '/account', // signed-in members
          '/api/', // data endpoints
          '/login',
          '/register',
          '/alumni/', // individual alumni profiles are for members only (the /alumni directory stays open)
          '/certificates/', // individual certificates (the /certificates verify page stays open)
          '/*?donate=', // personal donation links from reminder emails
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
