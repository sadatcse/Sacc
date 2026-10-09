'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { FaChevronLeft, FaChevronRight, FaExpand, FaImages, FaTimes } from 'react-icons/fa';
import { cn } from '@/lib/utils';

const ALL = '';

// Full-screen viewer: arrows / swipe to navigate, Esc to close
function Lightbox({ photos, index, onClose, onNavigate }) {
  const photo = photos[index];
  const [direction, setDirection] = useState(0);
  const go = useCallback(
    (step) => {
      setDirection(step);
      onNavigate((index + step + photos.length) % photos.length);
    },
    [index, photos.length, onNavigate]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [go, onClose]);

  const navButton = 'absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition-colors hover:border-orange-500 hover:bg-orange-500 sm:flex';

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm text-neutral-400" onClick={(e) => e.stopPropagation()}>
        <span>
          <span className="font-semibold text-white">{index + 1}</span> / {photos.length}
          <span className="ml-3 text-neutral-500">{photo.album}</span>
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-white transition-colors hover:bg-white/10">
          <FaTimes aria-hidden />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 sm:px-20">
        {photos.length > 1 && (
          <button type="button" aria-label="Previous photo" className={cn(navButton, 'left-4')} onClick={(e) => { e.stopPropagation(); go(-1); }}>
            <FaChevronLeft aria-hidden />
          </button>
        )}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={photo.src}
            custom={direction}
            initial={{ opacity: 0, x: direction * 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -80 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            drag={photos.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) go(1);
              else if (info.offset.x > 80) go(-1);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full max-h-full w-full items-center justify-center"
          >
            <Image
              src={photo.src}
              unoptimized={/^https?:/.test(photo.src)} // remote news images skip the optimizer
              alt={photo.caption || `${photo.album} photo ${index + 1}`}
              width={photo.width}
              height={photo.height}
              sizes="100vw"
              priority
              draggable={false}
              className="max-h-full w-auto max-w-full select-none rounded-lg object-contain shadow-2xl"
              style={{ maxHeight: 'calc(100vh - 140px)' }}
            />
          </motion.div>
        </AnimatePresence>
        {photos.length > 1 && (
          <button type="button" aria-label="Next photo" className={cn(navButton, 'right-4')} onClick={(e) => { e.stopPropagation(); go(1); }}>
            <FaChevronRight aria-hidden />
          </button>
        )}
      </div>

      <p className="min-h-[52px] px-4 py-3 text-center text-sm text-neutral-300" onClick={(e) => e.stopPropagation()}>
        {photo.caption}
      </p>
    </motion.div>
  );
}

// Masonry photo grid with album filter and lightbox. `photos` come from getGalleryPhotos() (gallery.service).
export default function GalleryGrid({ photos }) {
  const [album, setAlbum] = useState(ALL);
  const [openIndex, setOpenIndex] = useState(null);

  const albums = useMemo(() => {
    const counts = new Map();
    photos.forEach((p) => counts.set(p.album, (counts.get(p.album) || 0) + 1));
    return [...counts].map(([name, count]) => ({ name, count }));
  }, [photos]);

  const visible = useMemo(() => (album ? photos.filter((p) => p.album === album) : photos), [photos, album]);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-line/10 py-20 text-center">
        <FaImages className="text-4xl text-faint" aria-hidden />
        <p className="mt-4 font-semibold text-ink">No photos yet</p>
        <p className="mt-1 text-sm text-subtle">New photos from our events will appear here soon.</p>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      {albums.length > 1 && (
        <nav aria-label="Albums" className="-mx-4 mb-8 overflow-x-auto px-4 pb-2">
          <div className="flex gap-2 lg:flex-wrap">
            {[{ name: ALL, label: 'All Photos', count: photos.length }, ...albums].map(({ name, label, count }) => {
              const active = album === name;
              return (
                <button
                  key={name || 'all'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setAlbum(name)}
                  className={cn(
                    'relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    active ? 'border-transparent text-white' : 'border-line/10 bg-surface text-muted hover:border-orange-500/60 hover:text-ink-2'
                  )}
                >
                  {active && <motion.span layoutId="gallery-album" className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600 to-orange-500" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <span className="relative">{label || name}</span>
                  <span className={cn('relative rounded-full px-1.5 text-[11px]', active ? 'bg-line/20' : 'bg-line/5 text-subtle')}>{count}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {visible.map((photo, i) => (
          <motion.button
            key={photo.src}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`Open ${photo.caption || `photo ${i + 1}`}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border border-line/10 bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Image
              src={photo.src}
              unoptimized={/^https?:/.test(photo.src)} // remote news images skip the optimizer
              alt={photo.caption || `${photo.album} photo ${i + 1}`}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
              priority={i < 3}
              className="h-auto w-full transition-transform duration-700 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 scale-75 items-center justify-center rounded-full bg-orange-500 text-sm text-white opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
              <FaExpand aria-hidden />
            </span>
            {photo.caption && (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 text-left text-sm font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {photo.caption}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <Lightbox photos={visible} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
