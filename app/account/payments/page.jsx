import PaymentsPanel from '@/components/account/PaymentsPanel';

export const metadata = { title: 'Payments' };

export default function Page() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-ink">Payments</h1>
      <p className="mb-6 text-sm text-muted">Your membership, renewals, donations and everything you have paid to the club.</p>
      <PaymentsPanel />
    </>
  );
}
