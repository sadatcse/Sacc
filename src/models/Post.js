import mongoose from 'mongoose';

export const POST_TYPES = ['article', 'event'];
export const POST_STATUSES = ['published', 'draft'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// News article or event. Body blocks and the event object follow the shapes documented
// in src/data/seed/news.js (rendered by src/components/news/*).
const PostSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, enum: POST_TYPES, default: 'article' },
    status: { type: String, enum: POST_STATUSES, default: 'published', index: true },
    category: { type: String, required: [true, 'Category is required'], trim: true }, // key from src/data/news-categories.js
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    excerpt: { type: String, trim: true, default: '', maxlength: 500 },
    cover: { type: String, required: [true, 'Cover image is required'], trim: true },
    date: { type: String, required: true, match: [DAY, 'Date must be YYYY-MM-DD'], index: true }, // publish date
    author: {
      name: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
      verified: { type: Boolean, default: false },
    },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    body: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // { date, time?, venue?, organizer?, participants?, link?, guests? } — events only
    event: { type: mongoose.Schema.Types.Mixed, default: undefined },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
