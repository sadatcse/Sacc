'use client';
import { FaUsers, FaCalendarDay, FaEnvelope, FaEnvelopeOpen } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import PageTitle from '@/components/dashboard/PageTitle';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Placeholder from '@/components/ui/Placeholder';

export default function DashboardHome() {
  const visitors = useApi('/visitor/stats', { select: (res) => res.stats });
  const messages = useApi('/contact', { initialData: [], select: (res) => res.data || [] });

  const unread = messages.data.filter((m) => m.status === 'unread').length;

  return (
    <>
      <PageTitle title="Dashboard" description="Overview of site traffic and messages." />

      <StatGrid>
        <StatCard label="Total visitors" value={visitors.data?.total} icon={FaUsers} loading={visitors.loading} />
        <StatCard label="Visitors today" value={visitors.data?.today} icon={FaCalendarDay} tone="green" loading={visitors.loading} />
        <StatCard label="Total messages" value={messages.data.length} icon={FaEnvelopeOpen} tone="gray" loading={messages.loading} />
        <StatCard label="Unread messages" value={unread} icon={FaEnvelope} tone="amber" loading={messages.loading} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Traffic" action={<Button href="/dashboard/traffic" variant="ghost" size="sm">View analytics</Button>}>
          <Placeholder label="Traffic chart goes here" />
        </Card>
        <Card title="Inbox" action={<Button href="/dashboard/contact-messages" variant="ghost" size="sm">Open inbox</Button>}>
          <Placeholder label="Latest messages go here" />
        </Card>
      </div>
    </>
  );
}
