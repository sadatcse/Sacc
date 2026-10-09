import { Suspense } from 'react';
import RegisterView from '@/views/RegisterView';
import Spinner from '@/components/ui/Spinner';

export const metadata = { title: 'Create an account', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={<Spinner className="min-h-screen" />}>
      <RegisterView />
    </Suspense>
  );
}
