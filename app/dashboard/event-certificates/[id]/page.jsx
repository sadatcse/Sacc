import EventCertificateBoard from '@/views/dashboard/EventCertificateBoard';

export const metadata = { title: 'Event Certificates' };

export default async function Page({ params }) {
  const { id } = await params;
  return <EventCertificateBoard id={id} />;
}
