import PaymentsPanel from '@/components/account/PaymentsPanel';
import { getServerSession } from '@/lib/auth-guard';

export const metadata = { title: 'Payments' };

// Members: membership + renewals ("Payments" tab) · alumni: donations ("Donate" tab)
export default async function Page() {
  const session = await getServerSession();
  const alumni = session?.role === 'alumni';
  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-ink">{alumni ? 'Donate' : 'Payments'}</h1>
      <p className="mb-6 text-sm text-muted">
        {alumni ? 'Support the club’s contests, workshops and events — and see every donation you have made.' : 'Your membership, renewals and everything you have paid to the club.'}
      </p>
      <PaymentsPanel />
    </>
  );
}
