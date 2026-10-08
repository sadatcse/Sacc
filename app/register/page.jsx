import RegisterView from '@/views/RegisterView';

export const metadata = { title: 'Create an account', robots: { index: false, follow: false } };

export default function Page() {
  return <RegisterView />;
}
