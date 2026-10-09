import MembersDirectory from '@/components/members/MembersDirectory';

export const metadata = { title: 'Club Members' };

export default function Page() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-ink">Club Members</h1>
      <p className="mb-6 text-sm text-muted">Your fellow members of the computer club.</p>
      <MembersDirectory />
    </>
  );
}
