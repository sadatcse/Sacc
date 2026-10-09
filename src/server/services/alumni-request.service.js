// Student → alumni. Students ask from Account → Become Alumni; admins approve in Dashboard → Alumni → Requests.
// Admins can also turn a (graduated) student executive into an alumni entry from Dashboard → Executives.
// Either way one person ends up with one AlumniProfile: an existing entry with the same student ID is linked
// instead of creating a duplicate.
import AlumniRequest from '@/models/AlumniRequest';
import AlumniProfile from '@/models/AlumniProfile';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';
import Executive from '@/models/Executive';
import CommitteePosition from '@/models/CommitteePosition';
import { HttpError } from '@/server/http';
import { assertId, clean, links as cleanLinks, notFound, str, toPlain } from '@/server/validate';
import { ensureAlumniSlug } from '@/server/services/alumni.service';

const REQUEST_FIELDS = {
  studentId: 'text', department: 'text', batch: 'text', shift: 'shift', degree: 'text', graduationYear: 'number',
  jobTitle: 'text', company: 'text', location: 'text', note: 'longtext', hideProfile: 'boolean',
};

// ---------- shared: create or link the alumni profile ----------

// Finds the person's existing directory entry (same account, or same student ID and not someone else's account)
async function findExistingEntry({ userId, studentId }) {
  if (userId) {
    const own = await AlumniProfile.findOne({ user: userId });
    if (own) return own;
  }
  if (!studentId) return null;
  return AlumniProfile.findOne({ studentId, $or: [{ user: { $exists: false } }, { user: null }, ...(userId ? [{ user: userId }] : [])] });
}

// Fills only empty fields on an existing entry, so nothing the alumnus or an admin wrote is overwritten
async function upsertEntry(existing, data) {
  if (!existing) {
    const created = await AlumniProfile.create(data);
    return created;
  }
  for (const [key, value] of Object.entries(data)) {
    const current = existing[key];
    const empty = current === undefined || current === null || current === '' || (Array.isArray(current) && !current.length);
    if (['user', 'approved', 'hideProfile'].includes(key) || empty) existing[key] = value;
  }
  await existing.save();
  return existing;
}

// Turns a student account into an alumni account. The student profile is kept (history).
async function convertAccount(userId, details) {
  const user = await User.findById(userId);
  if (!user) throw notFound('User');
  const student = (await StudentProfile.findOne({ user: user._id }).lean()) || {};
  const existing = await findExistingEntry({ userId: user._id, studentId: details.studentId || student.studentId });
  const entry = await upsertEntry(existing, {
    user: user._id,
    name: user.name,
    photo: student.photo || '',
    bio: student.bio || '',
    skills: student.skills || [],
    links: cleanLinks(student.links || {}),
    studentId: details.studentId || student.studentId || '',
    department: details.department || student.department || '',
    batch: details.batch || student.batch || '',
    shift: details.shift || '',
    degree: details.degree || '',
    graduationYear: details.graduationYear || undefined,
    jobTitle: details.jobTitle || '',
    company: details.company || '',
    location: details.location || '',
    approved: true,
    hideProfile: Boolean(details.hideProfile),
  });
  if (user.role !== 'alumni') {
    user.role = 'alumni';
    await user.save();
  }
  await ensureAlumniSlug(entry._id);
  return { user, entry };
}

// ---------- student requests ----------

export async function submitRequest(user, input = {}) {
  if (user.role !== 'student') throw new HttpError(403, 'Only student accounts can ask to become alumni.');
  if (await AlumniRequest.exists({ user: user._id, status: 'pending' })) {
    throw new HttpError(409, 'You already have a request waiting for review.');
  }
  const data = clean(input, REQUEST_FIELDS);
  const missing = [['studentId', 'Student ID'], ['batch', 'Batch'], ['graduationYear', 'Graduation year']]
    .filter(([key]) => !data[key])
    .map(([, label]) => label);
  if (missing.length) throw new HttpError(400, `Please fill in: ${missing.join(', ')}.`);
  const thisYear = new Date().getFullYear();
  if (data.graduationYear < 1990 || data.graduationYear > thisYear + 1) throw new HttpError(400, 'Enter a valid graduation year.');
  const request = await AlumniRequest.create({ ...data, user: user._id, name: user.name, email: user.email });
  return toPlain(request.toObject());
}

// The student's latest request (any status), or null
export async function getMyRequest(userId) {
  const row = await AlumniRequest.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
  return row ? toPlain(row) : null;
}

export async function listRequests({ status } = {}) {
  const filter = ['pending', 'approved', 'rejected'].includes(status) ? { status } : {};
  return toPlain(await AlumniRequest.find(filter).sort({ createdAt: -1 }).limit(500).populate('reviewedBy', 'name').lean());
}

export async function countPendingRequests() {
  return AlumniRequest.countDocuments({ status: 'pending' });
}

// Body: { status: 'approved' | 'rejected', adminNote? }. Only pending requests can be decided.
export async function reviewRequest(id, input = {}, { userId } = {}) {
  assertId(id, 'request');
  const status = str(input.status);
  if (!['approved', 'rejected'].includes(status)) throw new HttpError(400, 'Approve or reject the request.');
  const request = await AlumniRequest.findById(id);
  if (!request) throw notFound('Request');
  if (request.status !== 'pending') throw new HttpError(409, `This request was already ${request.status}.`);
  let entry = null;
  if (status === 'approved') ({ entry } = await convertAccount(request.user, request.toObject()));
  Object.assign(request, { status, adminNote: str(input.adminNote, 1000), reviewedBy: userId, reviewedAt: new Date() });
  await request.save();
  return { request: toPlain(request.toObject()), slug: entry?.slug || '' };
}

// ---------- executives (admin) ----------

// "President '25" from the person's latest committee position
async function latestPositionLabel(executiveId) {
  const pos = await CommitteePosition.findOne({ executive: executiveId, type: 'executive' }).sort({ year: -1, order: 1 }).lean();
  return pos ? `${pos.role} '${String(pos.year).slice(-2)}` : '';
}

// Body: { hideProfile?, graduationYear?, jobTitle?, company? } → creates or links the alumni entry
export async function convertExecutive(id, input = {}) {
  assertId(id, 'executive');
  const exec = await Executive.findById(id);
  if (!exec) throw notFound('Executive');
  if (exec.kind === 'faculty') throw new HttpError(400, 'Faculty advisors cannot become alumni.');
  const extra = clean(input, { hideProfile: 'boolean', graduationYear: 'number', jobTitle: 'text', company: 'text' });
  const details = {
    studentId: exec.studentId,
    department: exec.department,
    batch: exec.batch,
    shift: exec.shift,
    graduationYear: extra.graduationYear || undefined,
    jobTitle: extra.jobTitle || '',
    company: extra.company || '',
    hideProfile: Boolean(extra.hideProfile),
  };
  const featured = await latestPositionLabel(exec._id);

  // Linked to a student login → convert the account too, so the person manages the profile themself
  const linkedUser = exec.user ? await User.findById(exec.user).select('role') : null;
  let entry;
  if (linkedUser && ['student', 'alumni'].includes(linkedUser.role)) {
    ({ entry } = await convertAccount(linkedUser._id, details));
  } else {
    const existing = await findExistingEntry({ studentId: exec.studentId });
    entry = await upsertEntry(existing, {
      name: exec.name,
      photo: exec.photo,
      bio: exec.bio,
      links: cleanLinks(exec.links?.toObject?.() || exec.links || {}),
      ...details,
      approved: true,
    });
  }
  if (featured && !entry.featured) {
    entry.featured = featured;
    await entry.save();
  }
  const slug = await ensureAlumniSlug(entry._id);
  return { alumniId: String(entry._id), slug, name: entry.name, linkedAccount: Boolean(linkedUser) };
}

// Alumni entry ids for executives (by student ID or linked account) — shows "Alumni ✓" in the dashboard
export async function alumniIdsForExecutives(executives) {
  const ids = executives.map((e) => e.studentId).filter(Boolean);
  const users = executives.map((e) => e.user).filter(Boolean);
  if (!ids.length && !users.length) return {};
  const rows = await AlumniProfile.find({ $or: [{ studentId: { $in: ids } }, { user: { $in: users } }] }).select('studentId user slug').lean();
  const out = {};
  for (const e of executives) {
    const hit = rows.find((r) => (e.studentId && r.studentId === e.studentId) || (e.user && String(r.user) === String(e.user)));
    if (hit) out[String(e._id)] = hit.slug || String(hit._id);
  }
  return out;
}
