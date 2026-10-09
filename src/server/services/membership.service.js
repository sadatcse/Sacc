// Club membership applications from /join. Public submissions are saved as 'draft';
// admins approve / reject them in Dashboard → Membership.
import MembershipApplication from '@/models/MembershipApplication';
import User, { MIN_PASSWORD_LENGTH } from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import { activateUser, createUser } from '@/server/services/user.service';
import {
  APPLICATION_STATUSES, BLOOD_GROUPS, MOBILE_PAYMENT_METHODS, PAYMENT_METHODS, PHOTO_MAX_BYTES, SHIFT_OPTIONS, SOFT_SKILLS, TSHIRT_SIZES,
} from '@/config/membership';
import { getSetting } from '@/server/services/settings.service';
import { HttpError } from '@/server/http';
import { assertId, notFound, str, toPlain } from '@/server/validate';
import { escapeRegex } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{8,20}$/;
const STATUS_VALUES = APPLICATION_STATUSES.map((s) => s.value);

// Detects the real image type from the first bytes (ignores the browser-sent type)
function sniffImage(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.readUInt32BE(0) === 0x89504e47) return 'image/png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

async function readPhoto(file) {
  if (!file || typeof file === 'string' || !file.size) throw new HttpError(400, 'Please upload a semi-formal photo of yourself.');
  if (file.size > PHOTO_MAX_BYTES) throw new HttpError(400, 'The photo must be 2 MB or smaller.');
  const data = Buffer.from(await file.arrayBuffer());
  const contentType = sniffImage(data);
  if (!contentType) throw new HttpError(400, 'The photo must be a JPG, PNG or WebP image.');
  return { data, contentType, size: data.length };
}

function cleanApplication(form, settings) {
  const get = (key, max = 200) => str(form.get(key), max);
  const data = {
    firstName: get('firstName', 60),
    lastName: get('lastName', 60),
    personalEmail: get('personalEmail', 160).toLowerCase(),
    phone: get('phone', 30),
    backupPhone: get('backupPhone', 30),
    studentId: get('studentId', 40),
    department: get('department', 120),
    batch: get('batch', 40),
    shift: get('shift', 10),
    tshirtSize: get('tshirtSize', 5),
    bloodGroup: get('bloodGroup', 5),
    facebook: get('facebook', 300),
    paymentMethod: get('paymentMethod', 20),
    paymentFrom: get('paymentFrom', 30),
    transactionId: get('transactionId', 60),
    softSkills: form.getAll('softSkills').map((s) => str(s, 40)).filter((s) => SOFT_SKILLS.includes(s)),
    experience: get('experience', 3000),
    amount: settings.fee,
  };

  const missing = [
    ['firstName', 'First name'], ['lastName', 'Last name'], ['personalEmail', 'Email'], ['phone', 'Phone'],
    ['studentId', 'Student ID'], ['department', 'Department'], ['batch', 'Batch'], ['shift', 'Shift'],
    ['tshirtSize', 'T-shirt size'], ['bloodGroup', 'Blood group'], ['paymentMethod', 'Payment method'],
  ].filter(([key]) => !data[key]).map(([, label]) => label);
  const isMobilePayment = MOBILE_PAYMENT_METHODS.includes(data.paymentMethod);
  if (isMobilePayment && !data.paymentFrom) missing.push('Number you paid from');
  if (isMobilePayment && !data.transactionId) missing.push('Transaction ID');
  if (missing.length) throw new HttpError(400, `Please fill in: ${missing.join(', ')}.`);

  if (!EMAIL_RE.test(data.personalEmail)) throw new HttpError(400, 'Enter a valid email address.');
  if (!PHONE_RE.test(data.phone)) throw new HttpError(400, 'Enter a valid phone number.');
  if (data.backupPhone && !PHONE_RE.test(data.backupPhone)) throw new HttpError(400, 'Enter a valid backup phone number.');
  if (!SHIFT_OPTIONS.some((s) => s.value === data.shift)) throw new HttpError(400, 'Shift must be Day or Evening.');
  if (!TSHIRT_SIZES.includes(data.tshirtSize)) throw new HttpError(400, 'Choose a T-shirt size.');
  if (!BLOOD_GROUPS.includes(data.bloodGroup)) throw new HttpError(400, 'Choose a blood group.');
  if (!PAYMENT_METHODS.some((m) => m.value === data.paymentMethod)) throw new HttpError(400, 'Choose a payment method.');
  if (data.facebook && !/^https?:\/\//i.test(data.facebook)) throw new HttpError(400, 'Facebook profile must be a link starting with https://');
  return data;
}

// The member's login. A new applicant chooses a password on the Join form and gets a 'pending' student
// account that becomes active when the membership is approved. Someone who already has an active
// account links the application to it by entering that account's password instead.
async function memberAccount(data, password) {
  const existing = await User.findOne({ email: data.personalEmail }).select('+password');
  if (existing?.status === 'active') {
    if (!(await existing.checkPassword(password))) {
      throw new HttpError(409, 'An account with this email already exists — enter that account’s password, or use another email.');
    }
    return { user: existing, accountCreated: false };
  }
  if (password.length < MIN_PASSWORD_LENGTH) throw new HttpError(400, `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (existing) {
    // Only a pending member account whose earlier applications were all rejected can be reused
    const open = existing.role === 'student' && existing.status === 'pending'
      ? await MembershipApplication.exists({ user: existing._id, status: { $in: ['draft', 'approved'] } })
      : true;
    if (open) {
      throw new HttpError(409, existing.status === 'pending'
        ? 'An account with this email is already waiting for approval.'
        : 'The account with this email is suspended. Please contact the club.');
    }
    Object.assign(existing, { name: `${data.firstName} ${data.lastName}`, phone: data.phone, password });
    await existing.save();
    await StudentProfile.updateOne({ user: existing._id }, { $set: { studentId: data.studentId, department: data.department, batch: data.batch } }, { upsert: true });
    return { user: existing, accountCreated: true };
  }
  const user = await createUser(
    { name: `${data.firstName} ${data.lastName}`, email: data.personalEmail, phone: data.phone, password, role: 'student', status: 'pending' },
    { profile: { studentId: data.studentId, department: data.department, batch: data.batch } }
  );
  return { user, accountCreated: true, isNew: true };
}

// Public: one application per student ID while it is draft or approved
export async function submitApplication(form, { ip } = {}) {
  const settings = await getSetting('membership');
  if (!settings.open) throw new HttpError(403, 'Registration is closed right now.');
  const data = cleanApplication(form, settings);
  const existing = await MembershipApplication.findOne({ studentId: data.studentId, status: { $in: ['draft', 'approved'] } }).select('status');
  if (existing) {
    throw new HttpError(409, existing.status === 'approved'
      ? 'This student ID is already a club member.'
      : 'We already have an application for this student ID — it is waiting for review.');
  }
  const photo = await readPhoto(form.get('photo'));
  const account = await memberAccount(data, String(form.get('password') || ''));
  let application;
  try {
    application = await MembershipApplication.create({ ...data, photo, ip, status: 'draft', user: account.user._id, accountCreated: account.accountCreated });
  } catch (error) {
    if (account.isNew) await Promise.all([User.deleteOne({ _id: account.user._id }), StudentProfile.deleteOne({ user: account.user._id })]);
    throw error;
  }
  const { photo: _photo, ...saved } = application.toObject();
  return toPlain(saved);
}

// ---------- admin ----------

export async function listApplications({ status, search } = {}) {
  const filter = {};
  if (STATUS_VALUES.includes(status)) filter.status = status;
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ firstName: re }, { lastName: re }, { studentId: re }, { personalEmail: re }, { phone: re }, { transactionId: re }, { batch: re }];
  }
  const rows = await MembershipApplication.find(filter).sort({ createdAt: -1 }).limit(2000).populate('reviewedBy', 'name').lean();
  return toPlain(rows);
}

export async function getPhoto(id) {
  assertId(id, 'application');
  const row = await MembershipApplication.findById(id).select('+photo.data photo.contentType').lean();
  if (!row?.photo?.data) throw notFound('Photo');
  return { data: Buffer.from(row.photo.data.buffer ?? row.photo.data), contentType: row.photo.contentType || 'image/jpeg' };
}

// Body: { status?, adminNote? }
export async function reviewApplication(id, input = {}, { userId } = {}) {
  assertId(id, 'application');
  const $set = {};
  const $unset = {};
  if ('status' in input) {
    if (!STATUS_VALUES.includes(input.status)) throw new HttpError(400, 'Invalid status.');
    $set.status = input.status;
    if (input.status === 'draft') Object.assign($unset, { reviewedBy: 1, reviewedAt: 1 });
    else Object.assign($set, { reviewedBy: userId, reviewedAt: new Date() });
  }
  if ('adminNote' in input) $set.adminNote = str(input.adminNote, 1000);
  const before = await MembershipApplication.findById(id).select('status').lean();
  if (!before) throw notFound('Application');
  const row = await MembershipApplication.findByIdAndUpdate(id, { $set, ...(Object.keys($unset).length && { $unset }) }, { returnDocument: 'after', runValidators: true })
    .populate('reviewedBy', 'name')
    .lean();
  if (!row) throw notFound('Application');
  // The member's login follows the decision: approved → active; un-approved → back to pending
  // (only for an account this application created — never for someone's existing account)
  if (row.user && row.status !== before.status) {
    if (row.status === 'approved') await activateUser(row.user);
    else if (before.status === 'approved' && row.accountCreated) await User.updateOne({ _id: row.user, status: 'active' }, { $set: { status: 'pending' } });
  }
  return { row: toPlain(row), previousStatus: before.status };
}

export async function deleteApplication(id) {
  assertId(id, 'application');
  const row = await MembershipApplication.findByIdAndDelete(id);
  if (!row) throw notFound('Application');
  // A login created by this application that was never approved goes with it
  if (row.accountCreated && row.user) {
    const removed = await User.findOneAndDelete({ _id: row.user, status: 'pending', role: 'student' });
    if (removed) await StudentProfile.deleteOne({ user: removed._id });
  }
}

export async function countApplications() {
  const rows = await MembershipApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  return Object.fromEntries(STATUS_VALUES.map((s) => [s, rows.find((r) => r._id === s)?.count || 0]));
}
