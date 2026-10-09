// Users, roles and the three profile types. Every login is a User; each role has its own profile model.
import User, { MIN_PASSWORD_LENGTH, ROLES, USER_STATUSES } from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import AdminProfile from '@/models/AdminProfile';
import AlumniProfile from '@/models/AlumniProfile';
import { profileFieldTypes } from '@/config/profiles';
import { HttpError } from '@/server/http';
import { assertId, clean, notFound, str, toPlain } from '@/server/validate';
import { escapeRegex } from '@/lib/utils';
import { ensureAlumniSlug } from '@/server/services/alumni.service';

const PROFILE_MODELS = { admin: AdminProfile, student: StudentProfile, alumni: AlumniProfile };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function toPublicUser(user) {
  const { _id, name, email, role, status, phone, lastLoginAt, createdAt } = user;
  return toPlain({ _id, name, email, role, status: status || 'active', phone, lastLoginAt, createdAt });
}

function checkPassword(password) {
  if (String(password || '').length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
}

function cleanAccount(input, { requireAll = false } = {}) {
  const data = clean(input, { name: 'text', email: 'text', phone: 'text', role: 'text', status: 'text' });
  if (data.email !== undefined) {
    data.email = data.email.toLowerCase();
    if (!EMAIL_RE.test(data.email)) throw new HttpError(400, 'Enter a valid email address.');
  }
  if (data.role !== undefined && !ROLES.includes(data.role)) throw new HttpError(400, 'Role must be admin, student or alumni.');
  if (data.status !== undefined && !USER_STATUSES.includes(data.status)) throw new HttpError(400, 'Invalid status.');
  if (requireAll && (!data.name || !data.email)) throw new HttpError(400, 'Name and email are required.');
  return data;
}

// The user's profile for their role — created on first access
export async function getProfile(user) {
  const Model = PROFILE_MODELS[user.role];
  const existing = await Model.findOne({ user: user._id }).lean();
  if (existing) return toPlain(existing);
  const fresh = await Model.create({ user: user._id, ...(user.role === 'alumni' && { name: user.name }) });
  return toPlain(fresh.toObject());
}

// Saves only the fields allowed for the user's role (see src/config/profiles.js)
export async function updateProfile(user, input = {}) {
  const Model = PROFILE_MODELS[user.role];
  const data = clean(input, profileFieldTypes(user.role));
  if (user.role === 'alumni') data.name = user.name; // directory name follows the account name
  const profile = await Model.findOneAndUpdate(
    { user: user._id },
    { $set: data, $setOnInsert: { user: user._id } },
    { upsert: true, returnDocument: 'after', runValidators: true }
  ).lean();
  if (user.role === 'alumni' && !profile.slug) profile.slug = await ensureAlumniSlug(profile._id);
  return toPlain(profile);
}

export async function authenticate(email, password) {
  const user = await User.findOne({ email: str(email, 160).toLowerCase() }).select('+password');
  if (!user || !(await user.checkPassword(password))) throw new HttpError(401, 'Incorrect email or password.');
  if (user.status === 'pending') throw new HttpError(403, 'Your account is waiting for approval. We will email you as soon as an admin approves it.');
  if (user.status === 'suspended') throw new HttpError(403, 'This account is suspended. Please contact an admin.');
  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

export async function createUser(input, { profile } = {}) {
  const data = cleanAccount(input, { requireAll: true });
  checkPassword(input.password);
  const user = await User.create({ ...data, password: String(input.password) });
  await getProfile(user);
  if (profile) await updateProfile(user, profile);
  return user;
}

export async function getUserById(id) {
  assertId(id, 'user');
  const user = await User.findById(id).lean();
  if (!user) throw notFound('User');
  return user;
}

export async function listUsers({ role, status, search } = {}) {
  const filter = {};
  if (ROLES.includes(role)) filter.role = role;
  if (USER_STATUSES.includes(status)) filter.status = status;
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: re }, { email: re }, { phone: re }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(1000).lean();
  // Accounts waiting for approval carry what they signed up with, so the admin can check it
  const pending = users.filter((u) => u.status === 'pending');
  const details = new Map(
    await Promise.all(
      pending.map(async (u) => {
        const p = (await PROFILE_MODELS[u.role].findOne({ user: u._id }).select('studentId batch department designation').lean()) || {};
        return [String(u._id), { studentId: p.studentId, batch: p.batch, department: p.department, designation: p.designation }];
      })
    )
  );
  return users.map((u) => ({ ...toPublicUser(u), ...(details.has(String(u._id)) && { signup: details.get(String(u._id)) }) }));
}

// Pending → active: the login works from now on and an alumni's directory entry goes live with it
// (the account and the directory entry are one record, approved together).
export async function activateUser(userOrId) {
  const user = await User.findOneAndUpdate({ _id: userOrId._id || userOrId, status: 'pending' }, { $set: { status: 'active' } }, { returnDocument: 'after' }).lean();
  if (user?.role === 'alumni') await AlumniProfile.updateOne({ user: user._id }, { $set: { approved: true } });
  return user; // null when it wasn't pending
}

// Admin update. A role change gives the user an (empty) profile for the new role.
// `user.activated` is true when this update approved a pending account.
export async function updateUser(id, input, { actorId } = {}) {
  assertId(id, 'user');
  const data = cleanAccount(input);
  if (String(actorId) === String(id) && ((data.role && data.role !== 'admin') || data.status === 'suspended')) {
    throw new HttpError(400, 'You cannot remove your own admin access.');
  }
  const user = await User.findById(id).select('+password');
  if (!user) throw notFound('User');
  const wasPending = user.status === 'pending';
  Object.assign(user, data);
  if (input.password) {
    checkPassword(input.password);
    user.password = String(input.password);
  }
  await user.save();
  const activated = wasPending && user.status === 'active';
  if (user.role === 'alumni') {
    await AlumniProfile.updateOne({ user: user._id }, { $set: { name: user.name, ...(activated && { approved: true }) } });
  }
  await getProfile(user);
  user.activated = activated;
  return user;
}

export async function updateOwnAccount(userId, input) {
  const user = await User.findById(userId);
  if (!user) throw notFound('User');
  const data = clean(input, { name: 'text', phone: 'text' });
  if (data.name === '') throw new HttpError(400, 'Name cannot be empty.');
  Object.assign(user, data);
  await user.save();
  if (user.role === 'alumni' && data.name) await AlumniProfile.updateOne({ user: user._id }, { $set: { name: user.name } });
  return user;
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw notFound('User');
  if (!(await user.checkPassword(currentPassword || ''))) throw new HttpError(400, 'Current password is incorrect.');
  checkPassword(newPassword);
  user.password = String(newPassword);
  await user.save();
}

// Removes the login and its student/admin profile. Alumni directory entries are kept but unlinked.
export async function deleteUser(id, { actorId } = {}) {
  assertId(id, 'user');
  if (String(actorId) === String(id)) throw new HttpError(400, 'You cannot delete your own account.');
  const user = await User.findByIdAndDelete(id);
  if (!user) throw notFound('User');
  await Promise.all([
    StudentProfile.deleteOne({ user: user._id }),
    AdminProfile.deleteOne({ user: user._id }),
    AlumniProfile.updateOne({ user: user._id }, { $unset: { user: 1 } }),
  ]);
}

export async function countUsersByRole() {
  const rows = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  return Object.fromEntries(ROLES.map((role) => [role, rows.find((r) => r._id === role)?.count || 0]));
}
