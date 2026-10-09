import { redirect } from 'next/navigation';

// Club Members lives in Dashboard → Membership now
export default function Page() {
  redirect('/dashboard/membership?tab=members');
}
