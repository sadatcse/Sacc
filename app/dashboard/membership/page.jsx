import { Suspense } from 'react';
import MembershipTabs from '@/views/dashboard/MembershipTabs';
import { DashboardSkeleton } from '@/components/loading/PageSkeletons';

export const metadata = { title: 'Membership' };

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MembershipTabs />
    </Suspense>
  );
}
