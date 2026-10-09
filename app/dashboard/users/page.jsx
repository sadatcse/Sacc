import { Suspense } from 'react';
import UsersManager from '@/views/dashboard/UsersManager';
import { DashboardSkeleton } from '@/components/loading/PageSkeletons';

export const metadata = { title: 'Users' };

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <UsersManager />
    </Suspense>
  );
}
