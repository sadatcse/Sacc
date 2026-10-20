import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';

// Link-preview image (Facebook, WhatsApp, LinkedIn, X…) for every page that has no picture of its own.
// News posts, executives and alumni use their own photo instead.
export const alt = `${siteConfig.name} — ${siteConfig.slogan}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logo = `data:image/png;base64,${(await readFile(path.join(process.cwd(), 'public', 'logo.png'))).toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(135deg, #0b0b0f 0%, #1c1917 55%, #431407 100%)', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', background: '#fff', borderRadius: 24, padding: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG by next/og */}
            <img src={logo} width={110} height={102} alt="" />
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: '#fdba74', letterSpacing: 2 }}>{siteConfig.shortName}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>{siteConfig.name}</div>
          <div style={{ display: 'flex', fontSize: 34, color: '#fb923c' }}>{siteConfig.slogan}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26, color: '#d4d4d8' }}>
          <div style={{ display: 'flex' }}>{siteConfig.tagline}</div>
          <div style={{ display: 'flex', height: 8, width: 220, borderRadius: 8, background: 'linear-gradient(90deg, #dc2626, #f97316)' }} />
        </div>
      </div>
    ),
    size
  );
}
