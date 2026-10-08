import NewsEditor from '@/views/dashboard/NewsEditor';

export const metadata = { title: 'Edit post' };

export default async function Page({ params }) {
  const { id } = await params;
  return <NewsEditor id={id} />;
}
