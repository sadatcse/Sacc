import { Suspense } from 'react';
import { LoginHistory } from '@/views/dashboard/AuditLogs';
import { DashboardSkeleton } from '@/components/loading/PageSkeletons';

export const metadata = { title: 'Login History' };

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <LoginHistory />
    </Suspense>
  );
}
