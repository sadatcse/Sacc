import { created, ok, readJson } from '@/server/http';
import * as alumni from '@/server/services/alumni.service';

// Public: approved directory entries. Admin ?all=1: every entry (filters: approved=yes|no, search).
export async function list({ query, session }) {
  if (query.get('all') && session?.role === 'admin') {
    return ok(await alumni.listAlumni({ approved: query.get('approved'), search: query.get('search') }));
  }
  return ok(await alumni.getApprovedAlumni());
}

export async function create({ req }) {
  return created(await alumni.createAlumni(await readJson(req)), 'Alumni entry added.');
}

export async function update({ req, params }) {
  return ok(await alumni.updateAlumni(params.id, await readJson(req)), 'Alumni entry saved.');
}

export async function remove({ params }) {
  await alumni.deleteAlumni(params.id);
  return ok(undefined, 'Alumni entry deleted.');
}
