// Club members directory (Dashboard → Club Members and Account → Club Members).
// Members = approved membership applications. Who sees what:
//   admins           → everything
//   female members   → everything
//   male members (and members whose gender isn't set) → female members' phone, email and Facebook are hidden
// The rule is applied here, on the server — hidden details never reach the browser.
import MembershipApplication from '@/models/MembershipApplication';
import StudentProfile from '@/models/StudentProfile';
import { HttpError } from '@/server/http';
import { escapeRegex } from '@/lib/utils';
import { str } from '@/server/validate';

// The viewer's rights: admins see all; students must be approved members themselves
export async function viewerFor(session) {
  if (session?.role === 'admin') return { admin: true, gender: '' };
  if (session?.role !== 'student') throw new HttpError(403, 'The member list is for club members.');
  const own = await MembershipApplication.findOne({ user: session._id, status: 'approved' }).select('gender').lean();
  if (!own) throw new HttpError(403, 'The member list opens once your club membership is approved.');
  return { admin: false, gender: own.gender || '' };
}

export async function listMembers({ batch, gender, search } = {}, viewer) {
  const filter = { status: 'approved' };
  if (batch) filter.batch = str(batch, 40);
  if (['male', 'female'].includes(gender)) filter.gender = gender;
  if (search) {
    const re = new RegExp(escapeRegex(str(search, 80)), 'i');
    filter.$or = [{ firstName: re }, { lastName: re }, { studentId: re }, { department: re }];
  }
  const [rows, batches, totals] = await Promise.all([
    MembershipApplication.find(filter)
      .select('firstName lastName studentId department batch shift gender phone personalEmail facebook bloodGroup user reviewedAt createdAt')
      .sort({ batch: -1, firstName: 1 })
      .limit(2000)
      .lean(),
    MembershipApplication.distinct('batch', { status: 'approved' }),
    MembershipApplication.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: '$gender', count: { $sum: 1 } } }]),
  ]);

  const photos = new Map(
    (await StudentProfile.find({ user: { $in: rows.map((r) => r.user).filter(Boolean) } }).select('user photo').lean()).map((p) => [String(p.user), p.photo])
  );
  const seeAll = viewer.admin || viewer.gender === 'female';

  const members = rows.map((m) => {
    const hidden = !seeAll && m.gender === 'female';
    return {
      _id: String(m._id),
      name: `${m.firstName} ${m.lastName}`.trim(),
      studentId: m.studentId,
      department: m.department,
      batch: m.batch,
      shift: m.shift,
      gender: m.gender || '',
      bloodGroup: m.bloodGroup,
      photo: (m.user && photos.get(String(m.user))) || '',
      memberSince: m.reviewedAt || m.createdAt,
      contactHidden: hidden,
      phone: hidden ? '' : m.phone,
      email: hidden ? '' : m.personalEmail,
      facebook: hidden ? '' : m.facebook,
    };
  });
  const count = (g) => totals.find((t) => (t._id || '') === g)?.count || 0;
  return {
    members,
    batches: batches.filter(Boolean).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })),
    stats: { total: totals.reduce((n, t) => n + t.count, 0), male: count('male'), female: count('female'), unset: count('') },
    viewer: { admin: viewer.admin, seesAll: seeAll },
  };
}
