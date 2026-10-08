// Club membership applications from /join. Public submissions are saved as 'draft';
// admins approve / reject them in Dashboard → Membership.
import MembershipApplication from '@/models/MembershipApplication';
import '@/models/User'; // registers the model for populate('reviewedBy')
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
  const application = await MembershipApplication.create({ ...data, photo, ip, status: 'draft' });
  return { _id: String(application._id), status: application.status };
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
  const row = await MembershipApplication.findByIdAndUpdate(id, { $set, ...(Object.keys($unset).length && { $unset }) }, { returnDocument: 'after', runValidators: true })
    .populate('reviewedBy', 'name')
    .lean();
  if (!row) throw notFound('Application');
  return toPlain(row);
}

export async function deleteApplication(id) {
  assertId(id, 'application');
  const row = await MembershipApplication.findByIdAndDelete(id);
  if (!row) throw notFound('Application');
}

export async function countApplications() {
  const rows = await MembershipApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  return Object.fromEntries(STATUS_VALUES.map((s) => [s, rows.find((r) => r._id === s)?.count || 0]));
}
