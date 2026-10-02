import { siteConfig } from '@/config/site';

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/login'] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
