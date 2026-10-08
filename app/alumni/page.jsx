import AlumniDirectory from '@/components/alumni/AlumniDirectory';
import DarkPageHeader from '@/components/ui/DarkPageHeader';
import { getApprovedAlumni } from '@/server/services/alumni.service';

export const metadata = {
  title: 'Alumni',
  description: 'Alumni directory — where former club members are now, with batch, role and social links.',
};

// Reads MongoDB on every request so dashboard edits show up immediately
export const dynamic = 'force-dynamic';

export default async function Page() {
  const alumni = await getApprovedAlumni();
  return (
    <div className="min-h-[70vh] bg-canvas text-body">
      <DarkPageHeader
        title="Alumni"
        accent="Directory"
        subtitle="Where our former members are now. Search by name, company or role, and filter by batch or position."
        breadcrumbs={[{ label: 'Alumni' }]}
      />

      <section className="container max-w-7xl 2xl:max-w-screen-2xl py-10 md:py-12">
        <AlumniDirectory alumni={alumni} />
      </section>
    </div>
  );
}
