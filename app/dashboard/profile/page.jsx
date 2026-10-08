import PageTitle from '@/components/dashboard/PageTitle';
import ProfileForm from '@/components/account/ProfileForm';
import PasswordForm from '@/components/account/PasswordForm';

export const metadata = { title: 'My Profile' };

export default function Page() {
  return (
    <>
      <PageTitle title="My Profile" description="Your faculty profile and password." />
      <div className="space-y-6">
        <ProfileForm />
        <PasswordForm />
      </div>
    </>
  );
}
