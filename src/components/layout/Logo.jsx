import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/config/site';

// Club logo + short name. Used by Navbar, Footer, dashboard and login. public/logo-sm.webp is a 112×104 copy of
// public/logo.png (270×251, 87 KB) — 11 KB, on every page.
export default function Logo({ className = '', showText = true }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-bold text-ink ${className}`}>
      <Image src="/logo-sm.webp" alt={`${siteConfig.name} logo`} width={39} height={36} className="h-9 w-auto" priority />
      {showText && <span className="leading-tight">{siteConfig.shortName}</span>}
    </Link>
  );
}
