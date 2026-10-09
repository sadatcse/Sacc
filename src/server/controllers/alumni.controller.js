import { after } from 'next/server';
import { created, ok, readJson } from '@/server/http';
import * as mail from '@/server/services/mail.service';
import { activateUser } from '@/server/services/user.service';
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

// Approving the directory entry of a pending alumni account approves the account as well —
// the login and the directory entry are one record.
export async function update({ req, params }) {
  const row = await alumni.updateAlumni(params.id, await readJson(req));
  if (row.approved && row.user?.status === 'pending') {
    const user = await activateUser(row.user._id);
    if (user) {
      row.user.status = 'active';
      after(() => mail.sendAccountApproved(user));
    }
  }
  return ok(row, 'Alumni entry saved.');
}

export async function remove({ params }) {
  await alumni.deleteAlumni(params.id);
  return ok(undefined, 'Alumni entry deleted.');
}
