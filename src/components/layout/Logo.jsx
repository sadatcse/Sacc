import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/config/site';

// Club logo (public/logo.png, 270×251) + short name. Used by Navbar, Footer, dashboard and login.
export default function Logo({ className = '', showText = true }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-bold text-ink ${className}`}>
      <Image src="/logo.png" alt={`${siteConfig.name} logo`} width={39} height={36} className="h-9 w-auto" priority />
      {showText && <span className="leading-tight">{siteConfig.shortName}</span>}
    </Link>
  );
}
