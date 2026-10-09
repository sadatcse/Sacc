import { Suspense } from 'react';
import { UserActivity } from '@/views/dashboard/AuditLogs';
import { DashboardSkeleton } from '@/components/loading/PageSkeletons';

export const metadata = { title: 'User Activity' };

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <UserActivity />
    </Suspense>
  );
}
