// News & events stored in MongoDB (Post model).
import connectDB from '@/lib/db';
import Post, { POST_STATUSES, POST_TYPES } from '@/models/Post';
import { newsCategories, UPCOMING } from '@/data/news-categories';
import { textToBlocks, textToGuests } from '@/lib/news-format';
import { HttpError } from '@/server/http';
import { assertId, list, makeSlug, notFound, str, toPlain } from '@/server/validate';
import { escapeRegex } from '@/lib/utils';
import { todayISO } from '@/lib/news-utils';
import { cache } from 'react';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORY_KEYS = newsCategories.map((c) => c.key).filter((k) => k !== UPCOMING);
const BLOCK_TYPES = ['p', 'h2', 'h3', 'quote', 'ul', 'ol', 'code', 'table', 'image'];
const LIST_FIELDS = '-body'; // list views don't need the full body

// ---------- reads (public pages) ----------

export async function getPublishedPosts() {
  await connectDB();
  const posts = await Post.find({ status: 'published' }).sort({ date: -1, createdAt: -1 }).lean();
  return toPlain(posts);
}

export async function getPostBySlug(slug, { includeDrafts = false } = {}) {
  await connectDB();
  const post = await Post.findOne({ slug: str(slug, 120).toLowerCase(), ...(!includeDrafts && { status: 'published' }) }).lean();
  return post ? toPlain(post) : null;
}

// Same category first, then shared tags, then newest
export async function getRelatedPosts(post, limit = 3) {
  await connectDB();
  const candidates = await Post.find({ status: 'published', slug: { $ne: post.slug } })
    .sort({ date: -1 })
    .limit(60)
    .lean();
  const score = (p) => (p.category === post.category ? 2 : 0) + (p.tags || []).filter((t) => post.tags?.includes(t)).length;
  return toPlain(candidates.sort((a, b) => score(b) - score(a)).slice(0, limit));
}

// Home page sections (one query per request, shared by the three sections)
const ACHIEVEMENT_CATEGORIES = ['activities-achievements', 'contests-hackathons', 'sports-games', 'projects-innovation'];

export const getHomeFeed = cache(async () => {
  await connectDB();
  const posts = toPlain(await Post.find({ status: 'published' }).select(LIST_FIELDS).sort({ date: -1, createdAt: -1 }).lean());
  const today = todayISO();
  const events = posts.filter((p) => p.type === 'event' && p.event?.date);
  const upcoming = events.filter((p) => p.event.date >= today).sort((a, b) => a.event.date.localeCompare(b.event.date));
  const counts = posts.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] || 0) + 1 }), {});
  return {
    upcoming: upcoming.slice(0, 4),
    recentEvents: events.filter((p) => p.event.date < today).slice(0, 4),
    workshops: posts.filter((p) => p.category === 'workshops-seminars').slice(0, 4),
    achievementPhotos: posts.filter((p) => ACHIEVEMENT_CATEGORIES.includes(p.category)).slice(0, 5),
    counts,
  };
});

// ---------- admin ----------

export async function listPosts({ status, type, category, search } = {}) {
  const filter = {};
  if (POST_STATUSES.includes(status)) filter.status = status;
  if (POST_TYPES.includes(type)) filter.type = type;
  if (CATEGORY_KEYS.includes(category)) filter.category = category;
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: re }, { excerpt: re }, { tags: re }, { slug: re }];
  }
  return toPlain(await Post.find(filter).select(LIST_FIELDS).sort({ date: -1, createdAt: -1 }).lean());
}

export async function getPostById(id) {
  assertId(id, 'post');
  const post = await Post.findById(id).lean();
  if (!post) throw notFound('Post');
  return toPlain(post);
}

function cleanBlock(b) {
  if (!b || !BLOCK_TYPES.includes(b.type)) return null;
  switch (b.type) {
    case 'ul':
    case 'ol':
      return { type: b.type, items: (b.items || []).map((x) => str(x, 2000)).filter(Boolean).slice(0, 100) };
    case 'code':
      return { type: 'code', lang: str(b.lang, 30), code: String(b.code ?? '').slice(0, 20000) };
    case 'table':
      return {
        type: 'table',
        headers: (b.headers || []).map((x) => str(x, 200)).slice(0, 12),
        rows: (b.rows || []).slice(0, 200).map((r) => (r || []).map((x) => str(x, 500)).slice(0, 12)),
        ...(b.caption && { caption: str(b.caption, 300) }),
      };
    case 'image':
      return { type: 'image', src: str(b.src, 500), alt: str(b.alt, 200), ...(b.caption && { caption: str(b.caption, 300) }) };
    default:
      return { type: b.type, text: str(b.text, 10000) };
  }
}

function cleanEvent(input = {}) {
  const date = str(input.date, 10);
  if (!DAY.test(date)) throw new HttpError(400, 'Event date must be YYYY-MM-DD.');
  const event = { date };
  for (const key of ['time', 'venue', 'organizer']) if (str(input[key])) event[key] = str(input[key], 300);
  const registered = Number(input.participants?.registered);
  const capacity = Number(input.participants?.capacity);
  if (capacity > 0 && registered >= 0) event.participants = { registered, capacity };
  if (str(input.link?.href)) event.link = { label: str(input.link.label, 60) || 'Learn more', href: str(input.link.href, 500) };
  const guests = typeof input.guestsText === 'string' ? textToGuests(input.guestsText) : input.guests;
  if (Array.isArray(guests) && guests.length) {
    event.guests = guests.slice(0, 20).map((g) => ({
      group: str(g.group, 80),
      people: (g.people || []).slice(0, 40).map((p) => ({ name: str(p.name, 200), title: str(p.title, 300) })).filter((p) => p.name),
    })).filter((g) => g.group && g.people.length);
  }
  return event;
}

// Turns an editor / API payload into a Post update. `partial` allows updating a subset of fields.
function cleanPost(input, { partial = false } = {}) {
  const data = {};
  const has = (key) => key in input;

  if (has('title')) data.title = str(input.title, 200);
  if (has('slug') || (!partial && data.title)) data.slug = makeSlug(str(input.slug) || data.title);
  if (has('type')) {
    if (!POST_TYPES.includes(input.type)) throw new HttpError(400, 'Type must be article or event.');
    data.type = input.type;
  }
  if (has('status')) {
    if (!POST_STATUSES.includes(input.status)) throw new HttpError(400, 'Status must be published or draft.');
    data.status = input.status;
  }
  if (has('category')) {
    if (!CATEGORY_KEYS.includes(input.category)) throw new HttpError(400, 'Unknown category.');
    data.category = input.category;
  }
  if (has('excerpt')) data.excerpt = str(input.excerpt, 500);
  if (has('cover')) data.cover = str(input.cover, 500);
  if (has('date')) {
    data.date = str(input.date, 10);
    if (!DAY.test(data.date)) throw new HttpError(400, 'Date must be YYYY-MM-DD.');
  }
  if (has('author')) {
    data.author = { name: str(input.author?.name, 120), role: str(input.author?.role, 120), verified: Boolean(input.author?.verified) };
  }
  if (has('tags')) data.tags = list(input.tags, 20);
  if (has('featured')) data.featured = Boolean(input.featured);
  if (has('bodyText')) data.body = textToBlocks(input.bodyText).map(cleanBlock).filter(Boolean);
  else if (has('body')) data.body = (Array.isArray(input.body) ? input.body : []).map(cleanBlock).filter(Boolean);

  const type = data.type ?? input.type;
  if (has('event') && type === 'event') data.event = cleanEvent(input.event);

  if (!partial) {
    for (const [key, label] of [['title', 'Title'], ['category', 'Category'], ['cover', 'Cover image'], ['date', 'Date']]) {
      if (!data[key]) throw new HttpError(400, `${label} is required.`);
    }
    if (data.type === 'event' && !data.event) throw new HttpError(400, 'Events need an event date.');
  }
  return data;
}

export async function createPost(input, { userId } = {}) {
  const data = cleanPost(input);
  const post = await Post.create({ ...data, createdBy: userId });
  return toPlain(post.toObject());
}

export async function updatePost(id, input) {
  assertId(id, 'post');
  const data = cleanPost(input, { partial: true });
  const update = { $set: data };
  if (data.type === 'article') {
    delete data.event;
    update.$unset = { event: 1 };
  }
  const post = await Post.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true }).lean();
  if (!post) throw notFound('Post');
  return toPlain(post);
}

export async function deletePost(id) {
  assertId(id, 'post');
  const post = await Post.findByIdAndDelete(id);
  if (!post) throw notFound('Post');
}

export async function countPosts() {
  const [published, draft] = await Promise.all([Post.countDocuments({ status: 'published' }), Post.countDocuments({ status: 'draft' })]);
  return { published, draft, total: published + draft };
}
