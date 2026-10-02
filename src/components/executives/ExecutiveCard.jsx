import Image from 'next/image';
import Link from 'next/link';
import RoleIcon from './RoleIcon';

export function initials(name = '') {
  return name
    .split(' ')
    .filter((w) => w && !w.endsWith('.'))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// Name + role on the left, photo (or initials) anchored bottom-right. Links to the profile.
export default function ExecutiveCard({ member }) {
  return (
    <Link
      href={`/executives/${member.slug}?year=${member.year}`}
      className="group relative flex h-28 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/70 transition-all duration-300 hover:border-orange-500/60 hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.6)]"
    >
      <div className="relative z-10 min-w-0 flex-1 p-5 pr-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-white transition-colors group-hover:text-orange-400">
          <RoleIcon role={member.role} className="shrink-0 text-orange-500" />
          <span className="truncate">{member.name}</span>
        </h3>
        <p className="mt-1 pl-6 text-sm text-neutral-400">{member.role}</p>
      </div>

      {member.photo ? (
        <div className="relative w-28 shrink-0">
          <Image
            src={member.photo}
            alt={member.name}
            fill
            sizes="112px"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex w-24 shrink-0 items-end justify-center pb-3">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-600/80 to-orange-500/80 text-lg font-bold text-white ring-4 ring-neutral-900 transition-transform duration-500 group-hover:scale-110">
            {initials(member.name)}
          </span>
        </div>
      )}
    </Link>
  );
}
