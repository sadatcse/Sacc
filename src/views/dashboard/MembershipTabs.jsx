'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaInbox, FaIdBadge } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import MembersDirectory from '@/components/members/MembersDirectory';
import MembershipManager from './MembershipManager';

const TABS = [
  { key: 'applications', label: 'Applications', icon: FaInbox },
  { key: 'members', label: 'Club Members', icon: FaIdBadge },
];

// Dashboard → Membership: the applications from /join, and the approved members (?tab=members)
export default function MembershipTabs() {
  const tab = useSearchParams().get('tab') === 'members' ? 'members' : 'applications';
  return (
    <>
      <nav className="mb-6 flex w-full gap-1 rounded-xl border border-line/10 bg-surface p-1 sm:w-fit" aria-label="Membership">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={key === 'members' ? '/dashboard/membership?tab=members' : '/dashboard/membership'}
            aria-current={tab === key ? 'page' : undefined}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none',
              tab === key ? 'bg-primary-600 text-white' : 'text-muted hover:bg-line/5 hover:text-ink'
            )}
          >
            <Icon aria-hidden /> {label}
          </Link>
        ))}
      </nav>
      {tab === 'members' ? (
        <>
          <PageTitle title="Club Members" description="Everyone whose membership is approved. Filter by batch and gender — admins see every contact detail." />
          <MembersDirectory />
        </>
      ) : (
        <MembershipManager />
      )}
    </>
  );
}
