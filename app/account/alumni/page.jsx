import { redirect } from 'next/navigation';

// The "Become Alumni" request was removed — old links go back to the account page
export default function Page() {
  redirect('/account');
}
