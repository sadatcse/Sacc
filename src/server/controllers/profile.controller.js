// The signed-in user's own account + role profile (any role)
import { HttpError, ok, readJson } from '@/server/http';
import * as users from '@/server/services/user.service';

async function currentUser(session) {
  const user = await users.getUserById(session._id).catch(() => null);
  if (!user) throw new HttpError(401, 'Session expired.');
  return user;
}

export async function show({ session }) {
  const user = await currentUser(session);
  return ok({ user: users.toPublicUser(user), profile: await users.getProfile(user) });
}

// Body: { name?, phone?, profile: { …role fields } }
export async function update({ req, session }) {
  const body = await readJson(req);
  const user = await users.updateOwnAccount(session._id, body);
  const profile = await users.updateProfile(user, body.profile || {});
  return ok({ user: users.toPublicUser(user), profile }, 'Profile saved.');
}
