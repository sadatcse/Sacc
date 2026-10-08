// Committee members (Executive) and the roles they held per year (CommitteePosition).
import connectDB from '@/lib/db';
import Executive, { PERSON_KINDS, SHIFTS } from '@/models/Executive';
import CommitteePosition, { POSITION_TYPES } from '@/models/CommitteePosition';
import { HttpError } from '@/server/http';
import { assertId, clean, makeSlug, notFound, str, toPlain } from '@/server/validate';

const PERSON_FIELDS = {
  name: 'text', photo: 'url', studentId: 'text', batch: 'text', department: 'text', designation: 'text',
  employeeId: 'text', school: 'text', office: 'text', officePhone: 'text', phone: 'text', personalEmail: 'text', bio: 'longtext', links: 'links',
};

// Details every person must have, by kind
export const REQUIRED_PERSON_FIELDS = {
  student: { name: 'Name', studentId: 'Student ID', batch: 'Batch', department: 'Department', shift: 'Shift (Day / Evening)' },
  faculty: { name: 'Name', department: 'Department', designation: 'Designation' },
};

function cleanPerson(input) {
  const data = clean(input, PERSON_FIELDS);
  if ('kind' in input) {
    if (!PERSON_KINDS.includes(input.kind)) throw new HttpError(400, 'Type must be student or faculty.');
    data.kind = input.kind;
  }
  if ('shift' in input) {
    const shift = str(input.shift).toLowerCase();
    if (shift && !SHIFTS.includes(shift)) throw new HttpError(400, 'Shift must be Day or Evening.');
    data.shift = shift;
  }
  return data;
}

// Throws listing every missing required detail for the person's kind
function assertComplete(person) {
  const required = REQUIRED_PERSON_FIELDS[person.kind || 'student'];
  const missing = Object.entries(required).filter(([key]) => !String(person[key] ?? '').trim()).map(([, label]) => label);
  if (missing.length) throw new HttpError(400, `Please fill in: ${missing.join(', ')}.`);
}

// ---------- reads (public pages) ----------

// Committee years, newest first
export async function getYears() {
  await connectDB();
  const years = await CommitteePosition.distinct('year');
  return years.sort((a, b) => b - a);
}

export async function getLatestYear() {
  return (await getYears())[0] ?? new Date().getFullYear();
}

// { advisors: [...], executives: [...] } for one year; each item = person + { role, year, type }
export async function getCommittee(year) {
  await connectDB();
  const rows = await CommitteePosition.find({ year: Number(year) }).sort({ order: 1, createdAt: 1 }).populate('executive').lean();
  const members = rows
    .filter((p) => p.executive)
    .map((p) => toPlain({ ...p.executive, positionId: p._id, role: p.role, year: p.year, type: p.type }));
  return {
    advisors: members.filter((m) => m.type === 'advisor'),
    executives: members.filter((m) => m.type === 'executive'),
  };
}

export async function getPerson(slug) {
  await connectDB();
  const person = await Executive.findOne({ slug: str(slug, 120).toLowerCase() }).lean();
  return person ? toPlain(person) : null;
}

// All positions a person has held, newest first
export async function getPositionsFor(personId) {
  await connectDB();
  const rows = await CommitteePosition.find({ executive: personId }).sort({ year: -1, order: 1 }).lean();
  return toPlain(rows);
}

// ---------- admin: people ----------

export async function listPeople() {
  const [people, counts] = await Promise.all([
    Executive.find().select('+phone +personalEmail').sort({ name: 1 }).lean(),
    CommitteePosition.aggregate([{ $group: { _id: '$executive', count: { $sum: 1 }, years: { $addToSet: '$year' } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c]));
  return toPlain(
    people.map((p) => ({ ...p, positionCount: byId.get(String(p._id))?.count || 0, years: (byId.get(String(p._id))?.years || []).sort((a, b) => b - a) }))
  );
}

export async function createPerson(input) {
  const data = { kind: 'student', ...cleanPerson(input) };
  assertComplete(data);
  const person = await Executive.create({ ...data, slug: makeSlug(str(input.slug) || data.name) });
  return toPlain(person.toObject());
}

export async function updatePerson(id, input) {
  assertId(id, 'person');
  const data = cleanPerson(input);
  if ('slug' in input) data.slug = makeSlug(str(input.slug) || data.name || '');
  const existing = await Executive.findById(id).select('+phone +personalEmail').lean();
  if (!existing) throw notFound('Person');
  assertComplete({ ...existing, ...data });
  const person = await Executive.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true }).select('+phone +personalEmail').lean();
  if (!person) throw notFound('Person');
  return toPlain(person);
}

// Deletes the person and every position they held
export async function deletePerson(id) {
  assertId(id, 'person');
  const person = await Executive.findByIdAndDelete(id);
  if (!person) throw notFound('Person');
  await CommitteePosition.deleteMany({ executive: person._id });
}

// ---------- admin: committee positions ----------

function cleanPosition(input, { partial = false } = {}) {
  const data = {};
  if ('executive' in input) {
    assertId(input.executive, 'person');
    data.executive = input.executive;
  }
  if ('year' in input) {
    data.year = Number(input.year);
    if (!Number.isInteger(data.year) || data.year < 1990 || data.year > 2100) throw new HttpError(400, 'Enter a valid year.');
  }
  if ('type' in input) {
    if (!POSITION_TYPES.includes(input.type)) throw new HttpError(400, 'Type must be advisor or executive.');
    data.type = input.type;
  }
  if ('role' in input) data.role = str(input.role, 120);
  if ('order' in input) data.order = Number(input.order) || 0;
  if (!partial && (!data.executive || !data.year || !data.role)) throw new HttpError(400, 'Person, year and role are required.');
  return data;
}

export async function listPositions({ year } = {}) {
  const filter = year ? { year: Number(year) } : {};
  const rows = await CommitteePosition.find(filter).sort({ year: -1, order: 1, createdAt: 1 }).populate('executive', 'name slug photo').lean();
  return toPlain(rows);
}

export async function createPosition(input) {
  const data = cleanPosition(input);
  if (!(await Executive.exists({ _id: data.executive }))) throw notFound('Person');
  if (!('order' in input)) data.order = await CommitteePosition.countDocuments({ year: data.year });
  const position = await CommitteePosition.create(data);
  return toPlain((await position.populate('executive', 'name slug photo')).toObject());
}

export async function updatePosition(id, input) {
  assertId(id, 'position');
  const data = cleanPosition(input, { partial: true });
  const position = await CommitteePosition.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true })
    .populate('executive', 'name slug photo')
    .lean();
  if (!position) throw notFound('Position');
  return toPlain(position);
}

export async function deletePosition(id) {
  assertId(id, 'position');
  const position = await CommitteePosition.findByIdAndDelete(id);
  if (!position) throw notFound('Position');
}
