// Alumni directory entries (AlumniProfile). Entries can belong to an alumni login or be added by an admin.
// Public: /alumni (directory) and /alumni/<slug> (profile page) — approved entries only.
import connectDB from '@/lib/db';
import AlumniProfile from '@/models/AlumniProfile';
import '@/models/User'; // registers the model for populate('user')
import { HttpError } from '@/server/http';
import { assertId, clean, notFound, str, toPlain } from '@/server/validate';
import { escapeRegex } from '@/lib/utils';

// Fields an admin may set (alumni edit their own via src/config/profiles.js)
const FIELDS = {
  name: 'text', photo: 'url', studentId: 'text', department: 'text', degree: 'text', batch: 'text', shift: 'shift',
  graduationYear: 'number', jobTitle: 'text', company: 'text', industry: 'text', location: 'text', country: 'text',
  bio: 'longtext', quote: 'longtext', skills: 'list', achievements: 'lines', experience: 'experience', education: 'education',
  links: 'links', openToMentor: 'boolean', showEmail: 'boolean', featured: 'text', approved: 'boolean',
};

// Shape used by <AlumniDirectory /> on /alumni
function toDirectoryEntry(a) {
  return {
    id: String(a._id),
    slug: a.slug,
    name: a.name,
    photo: a.photo || '',
    batch: a.batch || '',
    shift: a.shift || '',
    role: a.jobTitle || '',
    company: a.company || '',
    location: [a.location, a.country].filter(Boolean).join(', '),
    openToMentor: Boolean(a.openToMentor),
    links: { linkedin: a.links?.linkedin || '', github: a.links?.github || '', website: a.links?.website || '' },
    ...(a.featured && { featured: a.featured }),
  };
}

// Public profile — private fields (user link, approval flag, student ID, hidden email) removed
function toPublicProfile(a) {
  const { user, approved, showEmail, studentId, links = {}, ...rest } = a;
  return toPlain({ ...rest, links: { ...links, email: showEmail ? links.email : '' } });
}

// Gives entries without a slug one (the model hook runs on save, not on findOneAndUpdate)
export async function ensureAlumniSlug(id) {
  const doc = await AlumniProfile.findById(id);
  if (doc && !doc.slug) await doc.save();
  return doc?.slug;
}

export async function getApprovedAlumni() {
  await connectDB();
  const rows = await AlumniProfile.find({ approved: true }).sort({ name: 1 }).lean();
  return rows.map(toDirectoryEntry);
}

export async function getAlumniBySlug(slug) {
  await connectDB();
  const row = await AlumniProfile.findOne({ slug: str(slug, 160).toLowerCase(), approved: true }).lean();
  return row ? toPublicProfile(row) : null;
}

// Same batch first, then same company — for "More alumni" on the profile page
export async function getRelatedAlumni(profile, limit = 4) {
  await connectDB();
  const or = [profile.batch && { batch: profile.batch }, profile.company && { company: profile.company }].filter(Boolean);
  if (!or.length) return [];
  const rows = await AlumniProfile.find({ approved: true, _id: { $ne: profile._id }, $or: or }).limit(20).lean();
  const score = (a) => (a.batch === profile.batch ? 2 : 0) + (a.company === profile.company ? 1 : 0);
  return rows.sort((a, b) => score(b) - score(a)).slice(0, limit).map(toDirectoryEntry);
}

// ---------- admin ----------

export async function listAlumni({ approved, search } = {}) {
  const filter = {};
  if (approved === 'yes') filter.approved = true;
  if (approved === 'no') filter.approved = false;
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: re }, { company: re }, { jobTitle: re }, { batch: re }, { studentId: re }];
  }
  const rows = await AlumniProfile.find(filter).sort({ approved: 1, name: 1 }).populate('user', 'email status').lean();
  return toPlain(rows);
}

export async function createAlumni(input) {
  const data = clean(input, FIELDS);
  if (!data.name) throw new HttpError(400, 'Name is required.');
  const row = await AlumniProfile.create({ approved: true, ...data });
  return toPlain(row.toObject());
}

export async function updateAlumni(id, input) {
  assertId(id, 'alumni');
  const data = clean(input, FIELDS);
  if (data.name === '') throw new HttpError(400, 'Name cannot be empty.');
  const row = await AlumniProfile.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true })
    .populate('user', 'email status')
    .lean();
  if (!row) throw notFound('Alumni entry');
  if (!row.slug) row.slug = await ensureAlumniSlug(id);
  return toPlain(row);
}

export async function deleteAlumni(id) {
  assertId(id, 'alumni');
  const row = await AlumniProfile.findById(id);
  if (!row) throw notFound('Alumni entry');
  if (row.user) throw new HttpError(400, 'This entry belongs to an alumni account — hide it (unapprove) or delete the user instead.');
  await row.deleteOne();
}

export async function countAlumni() {
  const [approved, pending] = await Promise.all([AlumniProfile.countDocuments({ approved: true }), AlumniProfile.countDocuments({ approved: false })]);
  return { approved, pending };
}
