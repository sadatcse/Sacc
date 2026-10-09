import { ok } from '@/server/http';
import * as members from '@/server/services/members.service';

// Admins and approved student members. Filters: batch, gender, search.
export async function list({ query, session }) {
  const viewer = await members.viewerFor(session);
  return ok(await members.listMembers({ batch: query.get('batch'), gender: query.get('gender'), search: query.get('search') }, viewer));
}
