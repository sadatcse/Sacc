'use client';
import Link from 'next/link';
import {
  FaUsers, FaCalendarDay, FaEnvelope, FaNewspaper, FaUserGraduate, FaUserShield, FaUserTie, FaHourglassHalf, FaUserPlus, FaCheckCircle,
} from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import useAuth from '@/hooks/useAuth';
import PageTitle from '@/components/dashboard/PageTitle';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const QUICK_LINKS = [
  { href: '/dashboard/membership', label: 'Review membership applications', icon: FaUserPlus },
  { href: '/dashboard/news/new', label: 'Write a news post or event', icon: FaNewspaper },
  { href: '/dashboard/executives', label: 'Update the executive committee', icon: FaUserTie },
  { href: '/dashboard/alumni', label: 'Approve alumni profiles', icon: FaUserGraduate },
  { href: '/dashboard/users', label: 'Add a faculty member or student', icon: FaUsers },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const stats = useApi('/stats', { select: (res) => res.data });
  const visitors = useApi('/visitor/stats', { select: (res) => res.stats });
  const s = stats.data;

  return (
    <>
      <PageTitle title={`Welcome, ${user?.name?.split(' ')[0] || 'admin'}`} description="Overview of the club website." />

      <StatGrid>
        <StatCard label="Published posts" value={s?.posts.published} hint={s ? `${s.posts.draft} drafts` : undefined} icon={FaNewspaper} loading={stats.loading} />
        <StatCard label={`Committee ${s?.committee.year ?? ''}`} value={s?.committee.members} hint="members" icon={FaUserTie} tone="red" loading={stats.loading} />
        <StatCard label="Alumni listed" value={s?.alumni.approved} icon={FaUserGraduate} tone="green" loading={stats.loading} />
        <StatCard label="Alumni awaiting approval" value={s?.alumni.pending} icon={FaHourglassHalf} tone="amber" loading={stats.loading} />
      </StatGrid>

      <StatGrid cols={2}>
        <StatCard label="Membership applications to review" value={s?.applications.draft} hint="drafts" icon={FaUserPlus} tone="amber" loading={stats.loading} />
        <StatCard label="Approved club members" value={s?.applications.approved} icon={FaCheckCircle} tone="green" loading={stats.loading} />
      </StatGrid>

      <StatGrid>
        <StatCard label="Admins (faculty)" value={s?.users.admin} icon={FaUserShield} tone="red" loading={stats.loading} />
        <StatCard label="Students" value={s?.users.student} icon={FaUsers} loading={stats.loading} />
        <StatCard label="Alumni accounts" value={s?.users.alumni} icon={FaUserGraduate} tone="amber" loading={stats.loading} />
        <StatCard label="Unread messages" value={s?.unreadMessages} icon={FaEnvelope} tone="gray" loading={stats.loading} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Quick actions">
          <ul className="divide-y divide-line/5">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-3 py-3 text-sm font-medium text-body hover:text-primary-600 dark:hover:text-primary-400">
                  <Icon className="text-faint" /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Traffic" action={<Button href="/dashboard/traffic" variant="ghost" size="sm">View analytics</Button>}>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total visitors" value={visitors.data?.total} icon={FaUsers} loading={visitors.loading} />
            <StatCard label="Visitors today" value={visitors.data?.today} icon={FaCalendarDay} tone="green" loading={visitors.loading} />
          </div>
        </Card>
      </div>
    </>
  );
}
