import AlumniDirectory from '@/components/alumni/AlumniDirectory';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import { alumni } from '@/data/alumni';

export const metadata = {
  title: 'Alumni',
  description: 'Alumni directory — where former club members are now, with batch, role and social links.',
};

// To make this dynamic later: fetch from MongoDB here (server component) and pass the same shape in.
export default function Page() {
  return (
    <div className="min-h-[70vh] bg-black text-neutral-300">
      <DarkPageHeader
        title="Alumni"
        accent="Directory"
        subtitle="Where our former members are now. Search by name, company or role, and filter by batch or position."
        breadcrumbs={[{ label: 'Alumni' }]}
      />

      <section className="container max-w-7xl py-10 md:py-12">
        <AlumniDirectory alumni={alumni} />
      </section>
    </div>
  );
}
