'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChevronDown, FaIdCard, FaLock, FaSignOutAlt, FaThLarge, FaUserCog } from 'react-icons/fa';
import { cn } from '@/lib/utils';

// Links in the avatar dropdown, by role (admins manage the site, others have an account page)
export function userMenuLinks(user) {
  if (!user) return [];
  return user.role === 'admin'
    ? [
        { label: 'Dashboard', href: '/dashboard', icon: FaThLarge },
        { label: 'My profile', href: '/dashboard/profile', icon: FaUserCog },
      ]
    : [
        { label: 'My account', href: '/account', icon: FaIdCard },
        { label: 'Change password', href: '/account/security', icon: FaLock },
      ];
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
}

// Round profile picture, or initials on the brand gradient when there is no photo
export function Avatar({ user, size = 36, className }) {
  return (
    <span
      className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-red-600 to-orange-500 font-semibold text-white', className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {user.photo ? (
        <Image src={user.photo} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized />
      ) : (
        initials(user.name)
      )}
    </span>
  );
}

// Signed-in user's avatar button + dropdown (Dashboard / Profile / Log out)
export default function UserMenu({ user, onLogout, className }) {
  const pathname = usePathname();
  // Remembers the page it was opened on, so navigating closes it
  const [openOn, setOpenOn] = useState(null);
  const open = openOn === pathname;
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => !ref.current?.contains(e.target) && setOpenOn(null);
    const onKey = (e) => e.key === 'Escape' && setOpenOn(null);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpenOn(open ? null : pathname)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center gap-1.5 rounded-full border border-line/15 p-0.5 pr-0.5 transition-colors hover:border-orange-500/60 sm:pr-2"
      >
        <Avatar user={user} size={34} />
        <FaChevronDown aria-hidden className={cn('hidden text-xs text-muted transition-transform sm:block', open && 'rotate-180')} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line/10 bg-surface shadow-xl shadow-black/10">
          <div className="flex items-center gap-3 border-b border-line/10 px-4 py-3.5">
            <Avatar user={user} size={40} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-subtle">{user.email}</p>
            </div>
          </div>
          <div className="p-1.5">
            {userMenuLinks(user).map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} role="menuitem" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-body hover:bg-line/5 hover:text-ink">
                <Icon aria-hidden className="text-muted" /> {label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpenOn(null);
                onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
            >
              <FaSignOutAlt aria-hidden /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
