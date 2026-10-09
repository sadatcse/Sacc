import mongoose from 'mongoose';

export const GALLERY_SOURCES = ['upload', 'folder', 'news'];

// One photo on /gallery (and the home page preview). Managed in Dashboard → Gallery.
//   upload → the image is stored here (re-encoded WebP) and served by /api/gallery/image/<id>/<version>
//   folder → a file in public/gallery (imported once; `src` is its public path)
//   news   → a news post's cover / body image (`src` is that image, `post` the post)
// Replacing the picture stores a new upload and bumps `version`, so caches never show the old one.
const GalleryPhotoSchema = new mongoose.Schema(
  {
    source: { type: String, enum: GALLERY_SOURCES, default: 'upload', index: true },
    src: { type: String, trim: true, default: '' }, // folder / news photos (uploads compute theirs)
    image: {
      data: { type: Buffer, select: false },
      contentType: { type: String, default: '' },
      size: { type: Number, default: 0 },
    },
    version: { type: Number, default: 1 },
    width: { type: Number, default: 1200 },
    height: { type: Number, default: 800 },
    caption: { type: String, trim: true, default: '', maxlength: 200 },
    album: { type: String, trim: true, default: 'Moments', maxlength: 80, index: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    featured: { type: Boolean, default: false }, // pinned to the top
    hidden: { type: Boolean, default: false }, // kept in the dashboard, not shown on the site
    deletedAt: { type: Date }, // folder photos are only marked deleted, so a folder import doesn't bring them back
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

GalleryPhotoSchema.index({ featured: -1, createdAt: -1 });

export default mongoose.models.GalleryPhoto || mongoose.model('GalleryPhoto', GalleryPhotoSchema);
