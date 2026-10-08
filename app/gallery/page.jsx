import DarkPageHeader from '@/components/ui/DarkPageHeader';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { getGalleryPhotos } from '@/lib/gallery';

export const metadata = {
  title: 'Gallery',
  description: 'Moments from our events, workshops, competitions and celebrations.',
};

export default function Page() {
  const photos = getGalleryPhotos();

  return (
    <div className="min-h-[70vh] bg-canvas text-body">
      <DarkPageHeader
        title="Photo"
        accent="Gallery"
        subtitle="Moments from our events, workshops, competitions and celebrations. Click any photo to view it full size."
        breadcrumbs={[{ label: 'Gallery' }]}
      >
        {photos.length > 0 && (
          <p className="mt-4 text-sm text-subtle">
            <span className="font-semibold text-orange-600 dark:text-orange-400">{photos.length}</span> photos
          </p>
        )}
      </DarkPageHeader>

      <section className="container max-w-7xl 2xl:max-w-screen-2xl py-10 md:py-12">
        <GalleryGrid photos={photos} />
      </section>
    </div>
  );
}
