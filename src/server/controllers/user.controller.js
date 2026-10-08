// Admin user management
import { created, ok, readJson } from '@/server/http';
import * as users from '@/server/services/user.service';

export async function list({ query }) {
  const data = await users.listUsers({ role: query.get('role'), status: query.get('status'), search: query.get('search') });
  return ok(data);
}

// Body: { name, email, password, role, status?, phone?, profile? }
export async function create({ req }) {
  const body = await readJson(req);
  const user = await users.createUser(body, { profile: body.profile });
  return created(users.toPublicUser(user), 'User created.');
}

export async function show({ params }) {
  const user = await users.getUserById(params.id);
  return ok({ user: users.toPublicUser(user), profile: await users.getProfile(user) });
}

// Body: any of { name, email, role, status, phone, password, profile }
export async function update({ req, params, session }) {
  const body = await readJson(req);
  const user = await users.updateUser(params.id, body, { actorId: session._id });
  const profile = body.profile ? await users.updateProfile(user, body.profile) : await users.getProfile(user);
  return ok({ user: users.toPublicUser(user), profile }, 'User updated.');
}

export async function remove({ params, session }) {
  await users.deleteUser(params.id, { actorId: session._id });
  return ok(undefined, 'User deleted.');
}
