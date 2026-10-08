import { HttpError, created, ok, readJson } from '@/server/http';
import * as news from '@/server/services/news.service';

// Public: published posts. Admin with ?all=1: every post incl. drafts (filters: status, type, category, search).
export async function list({ query, session }) {
  if (query.get('all') && session?.role === 'admin') {
    return ok(await news.listPosts(Object.fromEntries(query)));
  }
  return ok(await news.getPublishedPosts());
}

// /api/news/<id or slug> — drafts only for admins
export async function show({ params, session }) {
  const isAdmin = session?.role === 'admin';
  const post = /^[a-f0-9]{24}$/i.test(params.id) && isAdmin
    ? await news.getPostById(params.id)
    : await news.getPostBySlug(params.id, { includeDrafts: isAdmin });
  if (!post) throw new HttpError(404, 'Post not found.');
  return ok(post);
}

export async function create({ req, session }) {
  return created(await news.createPost(await readJson(req), { userId: session._id }), 'Post created.');
}

export async function update({ req, params }) {
  return ok(await news.updatePost(params.id, await readJson(req)), 'Post saved.');
}

export async function remove({ params }) {
  await news.deletePost(params.id);
  return ok(undefined, 'Post deleted.');
}
