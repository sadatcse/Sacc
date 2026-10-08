import { Suspense } from 'react';
import LoginView from '@/views/LoginView';
import Spinner from '@/components/ui/Spinner';

export const metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={<Spinner className="min-h-screen" />}>
      <LoginView />
    </Suspense>
  );
}
